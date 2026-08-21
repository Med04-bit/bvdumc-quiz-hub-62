import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSubjects } from "@/hooks/use-subjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionPreview } from "./QuestionPreview";
import {
  AUTHORABLE_QUESTION_TYPES,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  optionLabel,
  parseAnswers,
  parseOptions,
  type Difficulty,
  type QuestionRecord,
  type QuestionType,
} from "@/lib/questions";

type Mode = "create" | "edit" | "duplicate";

type OptionDraft = { id: string; text: string };

type FormState = {
  question_text: string;
  question_type: QuestionType;
  options: OptionDraft[];
  correct: string[];
  explanation: string;
  source_reference: string;
  subject_id: string;
  topic_id: string;
  subtopic_id: string;
  tags: string;
  difficulty: Difficulty;
  points: string;
  negative_marks: string;
};

const NONE = "__none__";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function blankOptions(count = 4): OptionDraft[] {
  return Array.from({ length: count }, () => ({ id: newId(), text: "" }));
}

const TRUE_FALSE_OPTIONS: OptionDraft[] = [
  { id: "TRUE", text: "True" },
  { id: "FALSE", text: "False" },
];

const EMPTY: FormState = {
  question_text: "",
  question_type: "MCQ",
  options: blankOptions(),
  correct: [],
  explanation: "",
  source_reference: "",
  subject_id: "",
  topic_id: "",
  subtopic_id: "",
  tags: "",
  difficulty: "MEDIUM",
  points: "1",
  negative_marks: "0",
};

function toForm(question: QuestionRecord): FormState {
  const options = parseOptions(question.options);
  return {
    question_text: question.question_text,
    question_type: question.question_type,
    options: options.length ? options : blankOptions(),
    correct: parseAnswers(question.correct_answers),
    explanation: question.explanation ?? "",
    source_reference: question.source_reference ?? "",
    subject_id: question.subject_id ?? "",
    topic_id: question.topic_id ?? "",
    subtopic_id: question.subtopic_id ?? "",
    tags: (question.tags ?? []).join(", "),
    difficulty: question.difficulty,
    points: String(question.points ?? 1),
    negative_marks: String(question.negative_marks ?? 0),
  };
}

const STEPS = ["Question", "Answers", "Classification", "Explanation", "Review"];

export function QuestionFormDialog({
  trigger,
  question,
  mode = question ? "edit" : "create",
  onSaved,
}: {
  trigger: ReactNode;
  question?: QuestionRecord;
  mode?: Mode;
  onSaved?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(question ? toForm(question) : EMPTY);
  const { user } = useCurrentUser();
  const { subjects, topicsFor, subtopicsFor, subjectName, topicName } = useSubjects(open);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setForm(question ? toForm(question) : EMPTY);
      setStep(0);
    }
  }, [open, question]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isTrueFalse = form.question_type === "TRUE_FALSE";
  const multi = form.question_type === "MULTI_MCQ";
  const options = isTrueFalse ? TRUE_FALSE_OPTIONS : form.options;

  const tagsArray = useMemo(
    () =>
      form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tags],
  );

  function toggleCorrect(id: string) {
    setForm((prev) => {
      if (prev.question_type === "MULTI_MCQ") {
        const next = prev.correct.includes(id)
          ? prev.correct.filter((entry) => entry !== id)
          : [...prev.correct, id];
        return { ...prev, correct: next };
      }
      return { ...prev, correct: [id] };
    });
  }

  function changeType(type: QuestionType) {
    setForm((prev) => ({
      ...prev,
      question_type: type,
      correct: [],
      options: type === "TRUE_FALSE" ? TRUE_FALSE_OPTIONS : prev.options,
    }));
  }

  const filledOptions = options.filter((option) => option.text.trim().length > 0);
  const problems: string[] = [];
  if (!form.question_text.trim()) problems.push("Question text is required.");
  if (!isTrueFalse && filledOptions.length < 2) problems.push("Add at least two options.");
  if (form.correct.length === 0) problems.push("Mark the correct answer.");
  if (!multi && form.correct.length > 1) problems.push("Only one correct answer is allowed.");
  if (!form.subject_id) problems.push("Choose a subject.");

  const payload = () => ({
    question_text: form.question_text.trim(),
    question_type: form.question_type,
    options: (isTrueFalse ? TRUE_FALSE_OPTIONS : filledOptions).map((option) => ({
      id: option.id,
      text: option.text.trim(),
    })),
    correct_answers: form.correct,
    correct_answer: form.correct[0] ?? null,
    explanation: form.explanation.trim() || null,
    source_reference: form.source_reference.trim() || null,
    subject_id: form.subject_id || null,
    topic_id: form.topic_id || null,
    subtopic_id: form.subtopic_id || null,
    tags: tagsArray,
    difficulty: form.difficulty,
    points: Number(form.points) || 0,
    negative_marks: Number(form.negative_marks) || 0,
  });

  const save = useMutation({
    mutationFn: async (submitForReview: boolean) => {
      if (problems.length) throw new Error(problems[0]);
      const base = payload();
      const status = submitForReview ? "SUBMITTED" : undefined;

      if (mode === "edit" && question) {
        const { error } = await supabase
          .from("questions")
          .update({ ...base, ...(status ? { status } : {}) })
          .eq("id", question.id);
        if (error) throw error;
        return question.id;
      }

      const { data, error } = await supabase
        .from("questions")
        .insert({
          ...base,
          status: status ?? "DRAFT",
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id, submitForReview) => {
      toast.success(
        submitForReview
          ? "Question submitted for review."
          : mode === "edit"
            ? "Question saved."
            : "Draft created.",
      );
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question", id] });
      queryClient.invalidateQueries({ queryKey: ["question-stats"] });
      setOpen(false);
      onSaved?.(id);
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the question."),
  });

  const editingApproved = mode === "edit" && question?.status === "APPROVED";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit question"
              : mode === "duplicate"
                ? "Duplicate as new draft"
                : "New question"}
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                index === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        {editingApproved && (
          <Alert>
            <AlertTitle>This question is approved</AlertTitle>
            <AlertDescription>
              Saving content changes keeps version {question?.version_number} in history and creates
              a new draft version for review.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-2">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="q-type">Question type</Label>
                <Select value={form.question_type} onValueChange={(v) => changeType(v as QuestionType)}>
                  <SelectTrigger id="q-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTHORABLE_QUESTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {QUESTION_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-text">Question text</Label>
                <Textarea
                  id="q-text"
                  rows={6}
                  value={form.question_text}
                  onChange={(event) => set("question_text", event.target.value)}
                  placeholder="Type the question exactly as it should appear."
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {multi
                  ? "Tick every correct option."
                  : "Tick the single correct option."}
              </p>
              {options.map((option, index) => (
                <div key={option.id} className="flex items-start gap-2">
                  <Checkbox
                    className="mt-3"
                    checked={form.correct.includes(option.id)}
                    onCheckedChange={() => toggleCorrect(option.id)}
                    aria-label={`Mark option ${optionLabel(index)} correct`}
                  />
                  <span className="mt-2.5 w-5 text-sm font-semibold">{optionLabel(index)}</span>
                  <Input
                    value={option.text}
                    readOnly={isTrueFalse}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        options: prev.options.map((entry) =>
                          entry.id === option.id ? { ...entry, text: event.target.value } : entry,
                        ),
                      }))
                    }
                    placeholder={`Option ${optionLabel(index)}`}
                  />
                  {!isTrueFalse && form.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove option ${optionLabel(index)}`}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          options: prev.options.filter((entry) => entry.id !== option.id),
                          correct: prev.correct.filter((entry) => entry !== option.id),
                        }))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isTrueFalse && form.options.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      options: [...prev.options, { id: newId(), text: "" }],
                    }))
                  }
                >
                  <Plus className="size-4" /> Add option
                </Button>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="q-points">Marks</Label>
                  <Input
                    id="q-points"
                    type="number"
                    min="0"
                    value={form.points}
                    onChange={(event) => set("points", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-neg">Negative marks</Label>
                  <Input
                    id="q-neg"
                    type="number"
                    min="0"
                    step="0.25"
                    value={form.negative_marks}
                    onChange={(event) => set("negative_marks", event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="q-subject">Subject</Label>
                <Select
                  value={form.subject_id}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, subject_id: value, topic_id: "", subtopic_id: "" }))
                  }
                >
                  <SelectTrigger id="q-subject">
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects
                      .filter((subject) => subject.is_active || subject.id === form.subject_id)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-topic">Topic</Label>
                <Select
                  value={form.topic_id || NONE}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      topic_id: value === NONE ? "" : value,
                      subtopic_id: "",
                    }))
                  }
                >
                  <SelectTrigger id="q-topic">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No topic</SelectItem>
                    {topicsFor(form.subject_id || null).map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subtopicsFor(form.topic_id || null).length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="q-subtopic">Subtopic</Label>
                  <Select
                    value={form.subtopic_id || NONE}
                    onValueChange={(value) => set("subtopic_id", value === NONE ? "" : value)}
                  >
                    <SelectTrigger id="q-subtopic">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No subtopic</SelectItem>
                      {subtopicsFor(form.topic_id || null).map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="q-difficulty">Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(value) => set("difficulty", value as Difficulty)}
                >
                  <SelectTrigger id="q-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((level) => (
                      <SelectItem key={level} value={level}>
                        {DIFFICULTY_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-tags">Tags (comma separated)</Label>
                <Input
                  id="q-tags"
                  value={form.tags}
                  onChange={(event) => set("tags", event.target.value)}
                  placeholder="neuroanatomy, cranial nerves"
                />
                {tagsArray.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tagsArray.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="q-explanation">Explanation / answer rationale</Label>
                <Textarea
                  id="q-explanation"
                  rows={6}
                  value={form.explanation}
                  onChange={(event) => set("explanation", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-source">Source / reference</Label>
                <Input
                  id="q-source"
                  value={form.source_reference}
                  onChange={(event) => set("source_reference", event.target.value)}
                  placeholder="Harrison's 21e, p. 1420"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {problems.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Fix before submitting for review</AlertTitle>
                  <AlertDescription>
                    <ul className="list-inside list-disc">
                      {problems.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <div className="rounded-lg border p-4">
                <QuestionPreview
                  question={{
                    ...payload(),
                    tags: tagsArray,
                  }}
                  subjectName={subjectName(form.subject_id || null)}
                  topicName={topicName(form.topic_id || null)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            >
              Back
            </Button>
            <Button
              variant="outline"
              disabled={step === STEPS.length - 1}
              onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
            >
              Next
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={save.isPending || !form.question_text.trim()}
              onClick={() => save.mutate(false)}
            >
              Save draft
            </Button>
            <Button
              disabled={save.isPending || problems.length > 0}
              onClick={() => save.mutate(true)}
            >
              Save & submit for review
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
