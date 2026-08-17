import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/teams")({
  head: () => ({
    meta: [
      { title: "Teams — BVDUMC Quiz Society" },
      { name: "description", content: "Team formation and rosters for team-based quiz formats." },
      { property: "og:title", content: "Teams — BVDUMC Quiz Society" },
      { property: "og:description", content: "Team formation and rosters for team-based quiz formats." },
    ],
  }),
  component: () => (
    <ComingSoon title="Teams" description="Team formation and rosters for team-based quiz formats." />
  ),
});
