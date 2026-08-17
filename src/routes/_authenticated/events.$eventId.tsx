import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EventStatusBadge, type EventStatus } from "@/components/events/EventStatusBadge";

export const Route = createFileRoute("/_authenticated/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event details — BVDUMC Quiz Society" },
      { name: "description", content: "Schedule, venue and status details for a society quiz event." },
      { property: "og:title", content: "Event details — BVDUMC Quiz Society" },
      { property: "og:description", content: "Schedule, venue and status of a society quiz event." },
    ],
  }),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = useParams({ from: "/_authenticated/events/$eventId" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load this event</AlertTitle>
        <AlertDescription>Please refresh the page and try again.</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="surface-panel flex flex-col items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold">Event not found</h1>
        <p className="text-sm text-muted-foreground">It may have been deleted or archived.</p>
        <Button asChild variant="outline">
          <Link to="/events">Back to events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/events">
          <ArrowLeft className="size-4" /> All events
        </Link>
      </Button>

      <PageHeader
        title={data.name}
        description={data.description ?? "No description provided."}
        actions={<EventStatusBadge status={data.status as EventStatus} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DetailTile icon={CalendarDays} label="Date">
          {new Date(data.event_date).toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </DetailTile>
        <DetailTile icon={Clock} label="Timing">
          {data.start_time
            ? `${data.start_time.slice(0, 5)}${data.end_time ? ` – ${data.end_time.slice(0, 5)}` : ""}`
            : "Not scheduled"}
        </DetailTile>
        <DetailTile icon={MapPin} label="Venue">
          {data.venue ?? "To be confirmed"}
        </DetailTile>
      </div>

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Rounds, participants & scoring</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Quiz rounds, team registration, question assignment and live scoring for this event arrive
          in a later phase. The database already stores rounds, participants, teams and scores so
          this page can grow without rebuilding anything.
        </p>
      </section>
    </div>
  );
}

function DetailTile({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-panel p-5">
      <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-2 text-sm font-medium">{children}</p>
    </div>
  );
}
