import { Badge } from "@/components/ui/badge";

export const EVENT_STATUSES = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "LIVE",
  "COMPLETED",
  "ARCHIVED",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  REGISTRATION_OPEN: "Registration Open",
  REGISTRATION_CLOSED: "Registration Closed",
  LIVE: "Live",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const VARIANTS: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  REGISTRATION_OPEN: "bg-success/15 text-success",
  REGISTRATION_CLOSED: "bg-warning/20 text-warning-foreground",
  LIVE: "bg-destructive/15 text-destructive",
  COMPLETED: "bg-primary/10 text-primary",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge variant="outline" className={`border-transparent ${VARIANTS[status]}`}>
      {EVENT_STATUS_LABELS[status]}
    </Badge>
  );
}
