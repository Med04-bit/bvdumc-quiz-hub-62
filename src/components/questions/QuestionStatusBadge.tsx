import { Badge } from "@/components/ui/badge";
import { QUESTION_STATUS_LABELS, statusBadgeClass, type QuestionStatus } from "@/lib/questions";
import { cn } from "@/lib/utils";

export function QuestionStatusBadge({
  status,
  className,
}: {
  status: QuestionStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(statusBadgeClass(status), className)}>
      {QUESTION_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
