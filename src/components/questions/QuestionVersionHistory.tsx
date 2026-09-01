import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuestionStatusBadge } from "./QuestionStatusBadge";
import { QuestionPreview } from "./QuestionPreview";
import { formatDate, type QuestionStatus } from "@/lib/questions";

type VersionRow = {
  id: string;
  version_number: number;
  status: QuestionStatus;
  snapshot: Record<string, unknown>;
  changed_by: string | null;
  created_at: string;
};

export function QuestionVersionHistory({ questionId }: { questionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["question-versions", questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_versions")
        .select("id, version_number, status, snapshot, changed_by, created_at")
        .eq("question_id", questionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VersionRow[];
    },
  });

  const versions = data ?? [];

  return (
    <section className="surface-panel p-6">
      <h2 className="text-lg font-semibold">Version history</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every saved state is kept. Editing an approved question starts a new version and keeps the
        approved one intact.
      </p>
      {isLoading && <Skeleton className="mt-4 h-24 w-full" />}
      {!isLoading && versions.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No history recorded yet.</p>
      )}
      <Accordion type="single" collapsible className="mt-3">
        {versions.map((version) => {
          const snapshot = version.snapshot ?? {};
          return (
            <AccordionItem key={version.id} value={version.id}>
              <AccordionTrigger>
                <span className="flex flex-wrap items-center gap-2 text-left">
                  <span className="font-medium">Version {version.version_number}</span>
                  <QuestionStatusBadge status={version.status} />
                  <span className="text-xs font-normal text-muted-foreground">
                    {formatDate(version.created_at)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <QuestionPreview
                  question={{
                    question_text: String(snapshot["question_text"] ?? ""),
                    question_type: (snapshot["question_type"] ?? "MCQ") as never,
                    options: snapshot["options"],
                    correct_answers: snapshot["correct_answers"],
                    explanation: (snapshot["explanation"] as string | null) ?? null,
                    source_reference: (snapshot["source_reference"] as string | null) ?? null,
                    difficulty: (snapshot["difficulty"] ?? "MEDIUM") as never,
                    points: Number(snapshot["points"] ?? 0),
                    negative_marks: Number(snapshot["negative_marks"] ?? 0),
                    tags: (snapshot["tags"] as string[] | null) ?? null,
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
