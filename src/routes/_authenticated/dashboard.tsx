import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  FileEdit,
  ListOrdered,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EventFormDialog, type EventRecord } from "@/components/events/EventFormDialog";
import { EventStatusBadge } from "@/components/events/EventStatusBadge";
import { registrationLabel } from "@/lib/events";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BVDUMC Quiz Society" },
      { name: "description", content: "Organiser overview of upcoming, live, draft and completed quiz events." },
      { property: "og:title", content: "Dashboard — BVDUMC Quiz Society" },
      { property: "og:description", content: "Overview of society quiz operations." },
    ],
  }),
  component: DashboardPage,
});

const EVENT_FIELDS =
  "id, name, description, event_date, start_time, end_time, venue, online_platform, event_mode, registration_opens_at, registration_closes_at, status";

async function fetchDashboard() {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data as unknown as EventRecord[];
}

function DashboardPage() {
  const { user, roles, can, isLoading: userLoading } = useCurrentUser();
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchDashboard });

  const events = data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(
    (e) => e.event_date >= today && ["REGISTRATION_OPEN", "REGISTRATION_CLOSED"].includes(e.status),
  );
  const live = events.filter((e) => e.status === "LIVE");
  const drafts = events.filter((e) => e.status === "DRAFT");
  const completed = events.filter((e) => e.status === "COMPLETED");
  const registrationOpen = events.filter((e) => e.status === "REGISTRATION_OPEN");

  const loading = isLoading || userLoading;
  const canManageEvents = can("manageEvents");
  const nextEvents = [...live, ...upcoming, ...drafts].slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.fullName ?? "member"}`}
        description="A snapshot of society quiz operations."
        actions={
          canManageEvents ? (
            <EventFormDialog trigger={<Button>Create Event</Button>} />
          ) : undefined
        }
      />

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load the summary</AlertTitle>
          <AlertDescription>Please refresh the page and try again.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Upcoming events" value={upcoming.length} icon={CalendarDays} loading={loading} />
        <StatCard label="Live now" value={live.length} icon={CalendarCheck} loading={loading} />
        <StatCard label="Draft events" value={drafts.length} icon={FileEdit} loading={loading} />
        <StatCard label="Completed events" value={completed.length} icon={CheckCircle2} loading={loading} />
        <StatCard
          label="Registrations open"
          value={registrationOpen.length}
          icon={UserCheck}
          loading={loading}
          hint="Events currently accepting sign-ups"
        />
        <StatCard label="Total events" value={events.length} icon={ListOrdered} loading={loading} />
      </div>

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need while preparing a quiz event.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {canManageEvents && <EventFormDialog trigger={<Button>Create Event</Button>} />}
          <Button asChild variant="outline">
            <Link to="/events">Manage Events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/events">{canManageEvents ? "Create Quiz / Round" : "View Quizzes / Rounds"}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/events">Manage Quizzes / Rounds</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Rounds are managed inside each event, so these open the event list.
        </p>
        {!canManageEvents && (
          <p className="mt-4 text-xs text-muted-foreground">
            Your current role{roles.length > 1 ? "s do" : " does"} not allow creating or editing
            events. Ask a society admin for organiser access.
          </p>
        )}
      </section>

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Next up</h2>
        {loading && <Skeleton className="mt-4 h-24 w-full rounded-lg" />}
        {!loading && nextEvents.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No live, upcoming or draft events yet.</p>
        )}
        <ul className="mt-4 space-y-3">
          {nextEvents.map((event) => (
            <li key={event.id}>
              <Link
                to="/events/$eventId"
                params={{ eventId: event.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <p className="font-medium">{event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {registrationLabel(event)}
                  </p>
                </div>
                <EventStatusBadge status={event.status} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
