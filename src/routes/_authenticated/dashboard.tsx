import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarCheck, CalendarDays, ClipboardCheck, Users, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BVDUMC Quiz Society" },
      { name: "description", content: "Overview of events, participants, teams and question bank activity." },
      { property: "og:title", content: "Dashboard — BVDUMC Quiz Society" },
      { property: "og:description", content: "Overview of society quiz operations." },
    ],
  }),
  component: DashboardPage,
});

async function fetchStats() {
  const today = new Date().toISOString().slice(0, 10);
  const count = { count: "exact" as const, head: true };

  const [upcoming, active, participants, teams, questions, pendingReviews] = await Promise.all([
    supabase.from("events").select("*", count).gte("event_date", today).in("status", ["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED"]),
    supabase.from("events").select("*", count).eq("status", "LIVE"),
    supabase.from("participants").select("*", count),
    supabase.from("teams").select("*", count),
    supabase.from("questions").select("*", count),
    supabase.from("questions").select("*", count).in("status", ["SUBMITTED", "UNDER_REVIEW"]),
  ]);

  return {
    upcoming: upcoming.count ?? 0,
    active: active.count ?? 0,
    participants: participants.count ?? 0,
    teams: teams.count ?? 0,
    questions: questions.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
  };
}

function DashboardPage() {
  const { user, roles, can, isLoading: userLoading } = useCurrentUser();
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });

  const loading = isLoading || userLoading;
  const canManageEvents = can("manageEvents");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.fullName ?? "member"}`}
        description="A snapshot of society quiz operations."
        actions={
          canManageEvents ? (
            <Button asChild>
              <Link to="/events">Create Event</Link>
            </Button>
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
        <StatCard label="Upcoming events" value={data?.upcoming ?? 0} icon={CalendarDays} loading={loading} />
        <StatCard label="Active events" value={data?.active ?? 0} icon={CalendarCheck} loading={loading} />
        <StatCard label="Registered participants" value={data?.participants ?? 0} icon={Users} loading={loading} />
        <StatCard label="Registered teams" value={data?.teams ?? 0} icon={UsersRound} loading={loading} />
        <StatCard
          label="Questions"
          value={data?.questions ?? 0}
          icon={BookOpen}
          loading={loading}
          hint="Visible to setters, reviewers and admins"
        />
        <StatCard label="Pending reviews" value={data?.pendingReviews ?? 0} icon={ClipboardCheck} loading={loading} />
      </div>

      <section className="surface-panel p-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Actions become available as each module is delivered.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild disabled={!canManageEvents}>
            <Link to="/events">Create Event</Link>
          </Button>
          <Button variant="outline" disabled title="Available in a later phase">
            Add Participant
          </Button>
          <Button variant="outline" disabled title="Available in a later phase">
            Create Team
          </Button>
          <Button variant="outline" disabled title="Available in a later phase">
            Add Question
          </Button>
        </div>
        {!canManageEvents && (
          <p className="mt-4 text-xs text-muted-foreground">
            Your current role{roles.length > 1 ? "s do" : " does"} not allow creating events. Ask a
            society admin for access.
          </p>
        )}
      </section>
    </div>
  );
}
