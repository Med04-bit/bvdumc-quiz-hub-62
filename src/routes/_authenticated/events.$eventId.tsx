import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, CalendarDays, Clock, MapPin, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventFormDialog, type EventRecord } from "@/components/events/EventFormDialog";
import { EventRoundsPanel } from "@/components/events/EventRoundsPanel";
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EventStatusBadge,
  type EventStatus,
} from "@/components/events/EventStatusBadge";
import { registrationLabel } from "./events.index";

export const Route = createFileRoute("/_authenticated/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event details — BVDUMC Quiz Society" },
      { name: "description", content: "Schedule, venue, registration window and rounds of a society quiz event." },
      { property: "og:title", content: "Event details — BVDUMC Quiz Society" },
      { property: "og:description", content: "Schedule, rounds and status of a society quiz event." },
    ],
  }),
  component: EventDetailPage,
});

const EVENT_FIELDS =
  "id, name, description, event_date, start_time, end_time, venue, online_platform, event_mode, registration_opens_at, registration_closes_at, status";

function EventDetailPage() {
  const { eventId } = useParams({ from: "/_authenticated/events/$eventId" });
  const { can } = useCurrentUser();
  const canManage = can("manageEvents");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_FIELDS)
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as EventRecord) ?? null;
    },
  });

  const { data: participantCount } = useQuery({
    queryKey: ["event-participant-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: EventStatus) => {
      const { error } = await supabase.from("events").update({ status }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event status updated.");
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update the status."),
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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={data.status} />
            {canManage && (
              <>
                <Select
                  value={data.status}
                  onValueChange={(value) => updateStatus.mutate(value as EventStatus)}
                >
                  <SelectTrigger className="w-[190px]" aria-label="Event status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {EVENT_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <EventFormDialog
                  event={data}
                  trigger={
                    <Button variant="outline">
                      <Pencil className="size-4" /> Edit
                    </Button>
                  }
                />
                {data.status !== "ARCHIVED" && (
                  <Button variant="ghost" onClick={() => updateStatus.mutate("ARCHIVED")}>
                    <Archive className="size-4" /> Archive
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <DetailTile icon={MapPin} label={data.event_mode === "ONLINE" ? "Online platform" : "Venue"}>
          {data.event_mode === "ONLINE"
            ? data.online_platform || "To be confirmed"
            : data.venue || "To be confirmed"}
        </DetailTile>
        <DetailTile icon={Users} label="Participants">
          {participantCount ?? 0} registered
        </DetailTile>
      </div>

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Registration</h2>
        <p className="mt-1 text-sm text-muted-foreground">{registrationLabel(data)}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Opens</dt>
            <dd className="text-sm font-medium">
              {data.registration_opens_at
                ? new Date(data.registration_opens_at).toLocaleString()
                : "Not set"}
            </dd>
          </div>
          <div className="rounded-md border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Closes</dt>
            <dd className="text-sm font-medium">
              {data.registration_closes_at
                ? new Date(data.registration_closes_at).toLocaleString()
                : "Not set"}
            </dd>
          </div>
        </dl>
      </section>

      <EventRoundsPanel eventId={eventId} canManage={canManage} />

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Participants, teams & scoring</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Team registration, the question bank, live scoring and results for this event arrive in a
          later phase. The database already stores participants, teams and scores, so this page can
          grow without rebuilding anything.
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
