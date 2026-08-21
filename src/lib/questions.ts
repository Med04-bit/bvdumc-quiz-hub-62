import type { AcademicDivision } from "@/lib/roles";

export type QuestionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export const QUESTION_STATUSES: QuestionStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
];

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted for review",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export type QuestionType =
  | "MCQ"
  | "MULTI_MCQ"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "IMAGE_BASED"
  | "BUZZER";

/** Types the authoring form supports today. The schema accepts more without changes. */
export const AUTHORABLE_QUESTION_TYPES: QuestionType[] = ["MCQ", "MULTI_MCQ", "TRUE_FALSE"];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ: "MCQ — single answer",
  MULTI_MCQ: "MCQ — multiple answers",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  IMAGE_BASED: "Image based",
  BUZZER: "Buzzer",
};

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export type ReviewVerdict = "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "CHANGES_REQUESTED";

export const VERDICT_LABELS: Record<ReviewVerdict, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_REVISION: "Changes requested",
  CHANGES_REQUESTED: "Changes requested",
};

export type QuestionOption = { id: string; text: string };

export type QuestionRecord = {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: unknown;
  correct_answers: unknown;
  correct_answer: string | null;
  explanation: string | null;
  source_reference: string | null;
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  tags: string[] | null;
  difficulty: Difficulty;
  status: QuestionStatus;
  points: number;
  negative_marks: number;
  version_number: number;
  created_by: string | null;
  updated_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export const QUESTION_FIELDS =
  "id, question_text, question_type, options, correct_answers, correct_answer, explanation, source_reference, subject_id, topic_id, subtopic_id, tags, difficulty, status, points, negative_marks, version_number, created_by, updated_by, reviewed_by, reviewed_at, submitted_at, created_at, updated_at";

export type SubjectRecord = {
  id: string;
  name: string;
  code: string | null;
  division: AcademicDivision;
  is_active: boolean;
  sort_order: number;
};

export type TopicRecord = {
  id: string;
  subject_id: string;
  parent_topic_id: string | null;
  name: string;
  is_active: boolean;
};

export function parseOptions(value: unknown): QuestionOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      if (typeof entry === "string") return { id: String(index), text: entry };
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        return {
          id: String(record["id"] ?? index),
          text: String(record["text"] ?? ""),
        };
      }
      return { id: String(index), text: "" };
    })
    .filter((option) => option.text.length > 0 || option.id.length > 0);
}

export function parseAnswers(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function optionLabel(index: number): string {
  return OPTION_LETTERS[index] ?? String(index + 1);
}

/** Statuses an author may edit directly without starting a new version. */
export const AUTHOR_EDITABLE: QuestionStatus[] = ["DRAFT", "CHANGES_REQUESTED", "REJECTED"];

export const AWAITING_REVIEW: QuestionStatus[] = ["SUBMITTED", "UNDER_REVIEW"];

export function statusBadgeClass(status: QuestionStatus): string {
  switch (status) {
    case "APPROVED":
      return "border-transparent bg-emerald-600/15 text-emerald-700 dark:text-emerald-400";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "CHANGES_REQUESTED":
      return "border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-400";
    case "REJECTED":
      return "border-transparent bg-destructive/15 text-destructive";
    case "ARCHIVED":
      return "border-transparent bg-muted text-muted-foreground";
    default:
      return "border-transparent bg-secondary text-secondary-foreground";
  }
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Serialises a selected question set to CSV for export. */
export function questionsToCsv(
  rows: QuestionRecord[],
  subjectName: (id: string | null) => string,
  topicName: (id: string | null) => string,
): string {
  const header = [
    "Question",
    "Type",
    "Options",
    "Correct answer(s)",
    "Explanation",
    "Subject",
    "Topic",
    "Difficulty",
    "Marks",
    "Negative marks",
    "Tags",
    "Source",
    "Status",
    "Version",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) => {
    const options = parseOptions(row.options);
    const answers = parseAnswers(row.correct_answers);
    return [
      row.question_text,
      QUESTION_TYPE_LABELS[row.question_type] ?? row.question_type,
      options.map((o, i) => `${optionLabel(i)}. ${o.text}`).join(" | "),
      options.length
        ? options
            .map((o, i) => (answers.includes(o.id) ? optionLabel(i) : null))
            .filter(Boolean)
            .join(", ")
        : answers.join(", "),
      row.explanation ?? "",
      subjectName(row.subject_id),
      topicName(row.topic_id),
      row.difficulty,
      String(row.points),
      String(row.negative_marks),
      (row.tags ?? []).join(", "),
      row.source_reference ?? "",
      QUESTION_STATUS_LABELS[row.status],
      String(row.version_number),
    ]
      .map((cell) => escape(String(cell)))
      .join(",");
  });
  return [header.map(escape).join(","), ...lines].join("\n");
}
