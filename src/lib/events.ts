import type { EventRecord } from "@/components/events/EventFormDialog";

export function registrationLabel(event: EventRecord): string {
  const now = Date.now();
  const opens = event.registration_opens_at ? new Date(event.registration_opens_at).getTime() : null;
  const closes = event.registration_closes_at ? new Date(event.registration_closes_at).getTime() : null;
  if (!opens && !closes) return "Registration window not set";
  if (opens && now < opens) return `Registration opens ${new Date(opens).toLocaleString()}`;
  if (closes && now > closes) return "Registration closed";
  return closes ? `Registration closes ${new Date(closes).toLocaleString()}` : "Registration open";
}
