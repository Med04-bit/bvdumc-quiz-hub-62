import { Badge } from "@/components/ui/badge";
import {
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  optionLabel,
  parseAnswers,
  parseOptions,
  type Difficulty,
  type QuestionType,
} from "@/lib/questions";
import { cn } from "@/lib/utils";

export type PreviewData = {
  question_text: string;
  question_type: QuestionType;
  options: unknown;
  correct_answers: unknown;
  explanation: string | null;
  source_reference: string | null;
  difficulty: Difficulty;
  points: number;
  negative_marks: number;
  tags: string[] | null;
};

export function QuestionPreview({
  question,
  subjectName,
  topicName,
  showAnswerKey = true,
}: {
  question: PreviewData;
  subjectName?: string;
  topicName?: string;
  showAnswerKey?: boolean;
}) {
  const options = parseOptions(question.options);
  const answers = parseAnswers(question.correct_answers);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">{QUESTION_TYPE_LABELS[question.question_type]}</Badge>
        <Badge variant="secondary">{DIFFICULTY_LABELS[question.difficulty]}</Badge>
        {subjectName && <Badge variant="outline">{subjectName}</Badge>}
        {topicName && topicName !== "—" && <Badge variant="outline">{topicName}</Badge>}
        <Badge variant="outline">
          +{question.points}
          {Number(question.negative_marks) > 0 ? ` / −${question.negative_marks}` : ""}
        </Badge>
      </div>

      <p className="text-base leading-relaxed font-medium whitespace-pre-wrap">
        {question.question_text || "No question text yet."}
      </p>

      {options.length > 0 && (
        <ul className="space-y-2">
          {options.map((option, index) => {
            const correct = showAnswerKey && answers.includes(option.id);
            return (
              <li
                key={option.id}
                className={cn(
                  "flex gap-3 rounded-md border px-3 py-2 text-sm",
                  correct && "border-emerald-600/40 bg-emerald-600/10",
                )}
              >
                <span className="font-semibold">{optionLabel(index)}.</span>
                <span className="flex-1 whitespace-pre-wrap">{option.text}</span>
                {correct && (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Correct
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showAnswerKey && options.length === 0 && answers.length > 0 && (
        <p className="text-sm">
          <span className="text-muted-foreground">Correct answer: </span>
          <span className="font-medium">{answers.join(", ")}</span>
        </p>
      )}

      {question.explanation && (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Explanation
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{question.explanation}</p>
        </div>
      )}

      {question.source_reference && (
        <p className="text-xs text-muted-foreground">Source: {question.source_reference}</p>
      )}

      {(question.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(question.tags ?? []).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
