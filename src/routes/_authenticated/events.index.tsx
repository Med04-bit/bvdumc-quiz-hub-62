import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Monitor, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventFormDialog, type EventRecord } from "@/components/events/EventFormDialog";
import { EventStatusBadge, type EventStatus } from "@/components/events/EventStatusBadge";
import { registrationLabel } from "@/lib/events";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({
    meta: [
      { title: "Events — BVDUMC Quiz Society" },
      { name: "description", content: "Plan and track every quiz event run by the BVDUMC Quiz Society." },
      { property: "og:title", content: "Events — BVDUMC Quiz Society" },
      { property: "og:description", content: "Plan and track society quiz events." },
    ],
  }),
  component: EventsPage,
});

const EVENT_FIELDS =
  "id, name, description, event_date, start_time, end_time, venue, online_platform, event_mode, registration_opens_at, registration_closes_at, status";

async function fetchEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .order("event_date", { ascending: false });
  if (error) throw error;
  return data as unknown as EventRecord[];
}

const FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Drafts" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function matches(event: EventRecord, filter: Filter): boolean {
  const today = new Date().toISOString().slice(0, 10);
  switch (filter) {
    case "upcoming":
      return (
        event.event_date >= today &&
        ["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED"].includes(event.status)
      );
    case "live":
      return event.status === "LIVE";
    case "draft":
      return event.status === "DRAFT";
    case "completed":
      return event.status === "COMPLETED";
    case "archived":
      return event.status === "ARCHIVED";
    default:
      return true;
  }
}

function EventsPage() {
  const { can } = useCurrentUser();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const { data, isLoading, isError } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const events = (data ?? []).filter((event) => matches(event, filter));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Every quiz competition organised by the society."
        actions={
          can("manageEvents") ? (
            <EventFormDialog
              trigger={
                <Button>
                  <Plus className="size-4" /> Create Event
                </Button>
              }
            />
          ) : undefined
        }
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList className="flex-wrap">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load events</AlertTitle>
          <AlertDescription>Please refresh the page and try again.</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="surface-panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No events in this view</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {can("manageEvents")
              ? "Create an event or switch to another filter."
              : "Events created by the society organisers will appear here."}
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              to="/events/$eventId"
              params={{ eventId: event.id }}
              className="surface-panel block p-5 transition-shadow hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{event.name}</h2>
                <EventStatusBadge status={event.status as EventStatus} />
              </div>
              {event.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {new Date(event.event_date).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {event.event_mode === "ONLINE" ? (
                    <Monitor className="size-3.5" />
                  ) : (
                    <MapPin className="size-3.5" />
                  )}
                  {event.event_mode === "ONLINE"
                    ? event.online_platform || "Online"
                    : event.venue || "Venue TBC"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{registrationLabel(event)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
