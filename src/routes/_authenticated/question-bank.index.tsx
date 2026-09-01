import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CheckCircle2,
  Download,
  FileEdit,
  FolderTree,
  Inbox,
  Layers,
  Plus,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSubjects } from "@/hooks/use-subjects";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QuestionFormDialog } from "@/components/questions/QuestionFormDialog";
import { QuestionStatusBadge } from "@/components/questions/QuestionStatusBadge";
import {
  AWAITING_REVIEW,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  QUESTION_FIELDS,
  QUESTION_STATUSES,
  QUESTION_STATUS_LABELS,
  QUESTION_TYPE_LABELS,
  formatDate,
  questionsToCsv,
  type QuestionRecord,
  type QuestionStatus,
} from "@/lib/questions";
import { DIVISION_LABELS, reviewableDivisions } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/question-bank/")({
  head: () => ({
    meta: [
      { title: "Question Bank — BVDUMC Quiz Society" },
      {
        name: "description",
        content:
          "Author, classify, review and approve medical quiz questions for society events.",
      },
      { property: "og:title", content: "Question Bank — BVDUMC Quiz Society" },
      {
        property: "og:description",
        content: "Central source of approved questions for society quizzes.",
      },
    ],
  }),
  component: QuestionBankPage,
});

const ALL = "__all__";
const PAGE_SIZE = 20;

function QuestionBankPage() {
  const { user, roles, can } = useCurrentUser();
  const canAccess = can("accessQuestionBank");
  const canWrite = can("writeQuestions");
  const canReviewAny = can("reviewQuestions");
  const { subjects, subjectById, subjectName, topicName, topicsFor } = useSubjects(canAccess);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [subjectId, setSubjectId] = useState<string>(ALL);
  const [topicId, setTopicId] = useState<string>(ALL);
  const [difficulty, setDifficulty] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [tag, setTag] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [scope, setScope] = useState<"all" | "mine" | "my-review" | "reviewed-by-me">("all");
  const [usage, setUsage] = useState<"any" | "used" | "unused">("any");
  const [sort, setSort] = useState<"created_at" | "updated_at" | "difficulty">("created_at");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const myDivisions = useMemo(() => reviewableDivisions(roles), [roles]);
  const myDivisionSubjectIds = useMemo(
    () => subjects.filter((s) => myDivisions.includes(s.division)).map((s) => s.id),
    [subjects, myDivisions],
  );

  const usedIdsQuery = useQuery({
    queryKey: ["question-usage-ids"],
    enabled: canAccess && usage !== "any",
    queryFn: async () => {
      const { data, error } = await supabase.from("question_usage").select("question_id");
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((row) => row.question_id as string)));
    },
  });

  const filters = {
    search,
    status,
    subjectId,
    topicId,
    difficulty,
    type,
    tag,
    createdFrom,
    scope,
    usage,
    sort,
    page,
  };

  const listQuery = useQuery({
    queryKey: ["questions", filters, usedIdsQuery.data ?? null, user?.id ?? null],
    enabled: canAccess && (usage === "any" || usedIdsQuery.isSuccess),
    queryFn: async () => {
      let query = supabase
        .from("questions")
        .select(QUESTION_FIELDS, { count: "exact" })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (sort === "difficulty") query = query.order("difficulty", { ascending: true });
      else query = query.order(sort, { ascending: false });

      if (search.trim()) query = query.ilike("question_text", `%${search.trim()}%`);
      if (tag.trim()) query = query.contains("tags", [tag.trim()]);
      if (status !== ALL) query = query.eq("status", status as QuestionStatus);
      if (subjectId !== ALL) query = query.eq("subject_id", subjectId);
      if (topicId !== ALL) query = query.eq("topic_id", topicId);
      if (difficulty !== ALL) query = query.eq("difficulty", difficulty);
      if (type !== ALL) query = query.eq("question_type", type);
      if (createdFrom) query = query.gte("created_at", new Date(createdFrom).toISOString());
      if (scope === "mine" && user) query = query.eq("created_by", user.id);
      if (scope === "reviewed-by-me" && user) query = query.eq("reviewed_by", user.id);
      if (scope === "my-review") {
        query = query.in("status", AWAITING_REVIEW);
        if (!myDivisionSubjectIds.length) query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        else query = query.in("subject_id", myDivisionSubjectIds);
      }
      const usedIds = usedIdsQuery.data ?? [];
      if (usage === "used") query = query.in("id", usedIds.length ? usedIds : ["00000000-0000-0000-0000-000000000000"]);
      if (usage === "unused" && usedIds.length) query = query.not("id", "in", `(${usedIds.join(",")})`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as QuestionRecord[], count: count ?? 0 };
    },
  });

  const statsQuery = useQuery({
    queryKey: ["question-stats"],
    enabled: canAccess,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("status, subject_id, created_at")
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as { status: QuestionStatus; subject_id: string | null; created_at: string }[];
    },
  });

  const stats = statsQuery.data ?? [];
  const countBy = (value: QuestionStatus) => stats.filter((row) => row.status === value).length;
  const subjectCounts = useMemo(() => {
    const map = new Map<string, number>();
    stats.forEach((row) => {
      if (!row.subject_id) return;
      map.set(row.subject_id, (map.get(row.subject_id) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([id, count]) => ({ id, count, name: subjectById.get(id)?.name ?? "—" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [stats, subjectById]);

  const rows = listQuery.data?.rows ?? [];
  const total = listQuery.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const bulk = useMutation({
    mutationFn: async (action: "ARCHIVED" | "SUBMITTED") => {
      const { error } = await supabase
        .from("questions")
        .update({ status: action })
        .in("id", selected);
      if (error) throw error;
    },
    onSuccess: (_data, action) => {
      toast.success(
        action === "ARCHIVED" ? "Selected questions archived." : "Selected questions submitted.",
      );
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question-stats"] });
    },
    onError: (error: Error) => toast.error(error.message || "Some questions could not be updated."),
  });

  function exportSelected() {
    const chosen = rows.filter((row) => selected.includes(row.id));
    if (!chosen.length) return;
    const csv = questionsToCsv(chosen, subjectName, topicName);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bvdumc-questions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearch("");
    setStatus(ALL);
    setSubjectId(ALL);
    setTopicId(ALL);
    setDifficulty(ALL);
    setType(ALL);
    setTag("");
    setCreatedFrom("");
    setScope("all");
    setUsage("any");
    setPage(0);
  }

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <PageHeader title="Question Bank" description="Internal question authoring and review." />
        <Alert>
          <AlertTitle>Restricted area</AlertTitle>
          <AlertDescription>
            The question bank and its answer keys are limited to question setters, reviewers,
            academic heads, quizmasters and society leadership. Ask an admin if you need access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank"
        description="Author, classify, review and approve the questions used in society quizzes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/question-bank/subjects">
                <FolderTree className="size-4" /> Subjects & topics
              </Link>
            </Button>
            {canWrite && (
              <QuestionFormDialog
                trigger={
                  <Button>
                    <Plus className="size-4" /> New question
                  </Button>
                }
              />
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total questions" value={stats.length} icon={Layers} loading={statsQuery.isLoading} />
        <StatCard label="Drafts" value={countBy("DRAFT")} icon={FileEdit} loading={statsQuery.isLoading} />
        <StatCard
          label="Awaiting review"
          value={countBy("SUBMITTED") + countBy("UNDER_REVIEW")}
          icon={Inbox}
          loading={statsQuery.isLoading}
        />
        <StatCard label="Approved" value={countBy("APPROVED")} icon={CheckCircle2} loading={statsQuery.isLoading} />
        <StatCard
          label="Changes requested"
          value={countBy("CHANGES_REQUESTED")}
          icon={XCircle}
          loading={statsQuery.isLoading}
        />
        <StatCard label="Archived" value={countBy("ARCHIVED")} icon={Archive} loading={statsQuery.isLoading} />
      </div>

      {canReviewAny && (
        <Alert>
          <AlertTitle>Your review scope</AlertTitle>
          <AlertDescription>
            You can review questions in:{" "}
            {myDivisions.length
              ? myDivisions.map((division) => DIVISION_LABELS[division]).join(", ")
              : "no divisions yet"}
            . Use the “Awaiting my review” filter to see them.
          </AlertDescription>
        </Alert>
      )}

      <section className="surface-panel space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5 xl:col-span-2">
            <Label htmlFor="q-search">Search question text</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                id="q-search"
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search…"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-tag">Tag</Label>
            <Input
              id="q-tag"
              value={tag}
              onChange={(event) => {
                setTag(event.target.value);
                setPage(0);
              }}
              placeholder="cranial nerves"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-from">Created after</Label>
            <Input
              id="q-from"
              type="date"
              value={createdFrom}
              onChange={(event) => {
                setCreatedFrom(event.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label="Status" value={status} onChange={setStatus} setPage={setPage}
            options={QUESTION_STATUSES.map((s) => ({ value: s, label: QUESTION_STATUS_LABELS[s] }))} allLabel="All statuses" />
          <FilterSelect
            label="Subject"
            value={subjectId}
            onChange={(value) => {
              setSubjectId(value);
              setTopicId(ALL);
            }}
            setPage={setPage}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            allLabel="All subjects"
          />
          <FilterSelect
            label="Topic"
            value={topicId}
            onChange={setTopicId}
            setPage={setPage}
            options={topicsFor(subjectId === ALL ? null : subjectId).map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            allLabel="All topics"
          />
          <FilterSelect label="Difficulty" value={difficulty} onChange={setDifficulty} setPage={setPage}
            options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))} allLabel="Any difficulty" />
          <FilterSelect label="Type" value={type} onChange={setType} setPage={setPage}
            options={(["MCQ", "MULTI_MCQ", "TRUE_FALSE"] as const).map((t) => ({ value: t, label: QUESTION_TYPE_LABELS[t] }))} allLabel="Any type" />
          <div className="space-y-1.5">
            <Label>People</Label>
            <Select value={scope} onValueChange={(value) => { setScope(value as typeof scope); setPage(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="mine">Created by me</SelectItem>
                <SelectItem value="my-review">Awaiting my review</SelectItem>
                <SelectItem value="reviewed-by-me">Reviewed by me</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Usage</Label>
            <Select value={usage} onValueChange={(value) => { setUsage(value as typeof usage); setPage(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Used or unused</SelectItem>
                <SelectItem value="used">Already used</SelectItem>
                <SelectItem value="unused">Never used</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sort by</Label>
            <Select value={sort} onValueChange={(value) => { setSort(value as typeof sort); setPage(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest first</SelectItem>
                <SelectItem value="updated_at">Recently updated</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
          <span className="text-xs text-muted-foreground">{total} matching questions</span>
        </div>
      </section>

      {selected.length > 0 && (
        <div className="surface-panel flex flex-wrap items-center gap-2 p-4">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button variant="outline" size="sm" onClick={exportSelected}>
            <Download className="size-4" /> Export CSV
          </Button>
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              disabled={bulk.isPending}
              onClick={() => bulk.mutate("SUBMITTED")}
            >
              <Send className="size-4" /> Submit for review
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={bulk.isPending}>
                <Archive className="size-4" /> Archive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive {selected.length} question(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  Archived questions stay in the bank with their full history but are excluded from
                  future quiz building. You can restore them by editing the question.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => bulk.mutate("ARCHIVED")}>Archive</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear selection
          </Button>
        </div>
      )}

      <section className="surface-panel overflow-hidden">
        {listQuery.isLoading && <Skeleton className="m-5 h-40" />}
        {listQuery.isError && (
          <Alert variant="destructive" className="m-5 w-auto">
            <AlertTitle>Could not load questions</AlertTitle>
            <AlertDescription>Please refresh and try again.</AlertDescription>
          </Alert>
        )}
        {!listQuery.isLoading && rows.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No questions match these filters yet.
          </p>
        )}

        {rows.length > 0 && (
          <div className="divide-y">
            <div className="flex items-center gap-3 px-5 py-3 text-xs text-muted-foreground">
              <Checkbox
                aria-label="Select all on this page"
                checked={selected.length > 0 && rows.every((row) => selected.includes(row.id))}
                onCheckedChange={(checked) =>
                  setSelected(checked ? rows.map((row) => row.id) : [])
                }
              />
              <span>Select all on this page</span>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="flex items-start gap-3 px-5 py-4">
                <Checkbox
                  className="mt-1"
                  aria-label="Select question"
                  checked={selected.includes(row.id)}
                  onCheckedChange={(checked) =>
                    setSelected((prev) =>
                      checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/question-bank/$questionId"
                    params={{ questionId: row.id }}
                    className="line-clamp-2 text-sm font-medium hover:underline"
                  >
                    {row.question_text}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <QuestionStatusBadge status={row.status} />
                    <Badge variant="outline" className="text-[10px]">
                      {subjectName(row.subject_id)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {DIFFICULTY_LABELS[row.difficulty]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {QUESTION_TYPE_LABELS[row.question_type]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      v{row.version_number}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Updated {formatDate(row.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t px-5 py-3">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Subject-wise counts</h2>
        {statsQuery.isLoading && <Skeleton className="mt-4 h-16 w-full" />}
        {!statsQuery.isLoading && subjectCounts.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No classified questions yet.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {subjectCounts.map((entry) => (
            <Badge key={entry.id} variant="secondary">
              {entry.name}: {entry.count}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  setPage,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  setPage: (page: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          onChange(next);
          setPage(0);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
