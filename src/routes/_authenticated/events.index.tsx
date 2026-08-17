import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EventStatusBadge, type EventStatus } from "@/components/events/EventStatusBadge";

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

async function fetchEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, description, event_date, start_time, end_time, venue, status")
    .order("event_date", { ascending: false });
  if (error) throw error;
  return data;
}

function EventsPage() {
  const { can } = useCurrentUser();
  const { data, isLoading, isError } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Every quiz competition organised by the society."
        actions={can("manageEvents") ? <CreateEventDialog /> : undefined}
      />

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

      {!isLoading && !isError && data?.length === 0 && (
        <div className="surface-panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No events yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {can("manageEvents")
              ? "Create the society's first quiz event to get started."
              : "Events created by the society admins will appear here."}
          </p>
        </div>
      )}

      {!!data?.length && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((event) => (
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
                {event.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {event.venue}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
