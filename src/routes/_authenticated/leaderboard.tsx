import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — BVDUMC Quiz Society" },
      { name: "description", content: "Live and final standings across rounds and events." },
      { property: "og:title", content: "Leaderboard — BVDUMC Quiz Society" },
      { property: "og:description", content: "Live and final standings across rounds and events." },
    ],
  }),
  component: () => (
    <ComingSoon title="Leaderboard" description="Live and final standings across rounds and events." />
  ),
});
