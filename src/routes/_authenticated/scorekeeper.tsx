import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/scorekeeper")({
  head: () => ({
    meta: [
      { title: "Scorekeeper — BVDUMC Quiz Society" },
      { name: "description", content: "Live score entry, verification and round-wise tallies." },
      { property: "og:title", content: "Scorekeeper — BVDUMC Quiz Society" },
      { property: "og:description", content: "Live score entry, verification and round-wise tallies." },
    ],
  }),
  component: () => (
    <ComingSoon title="Scorekeeper" description="Live score entry, verification and round-wise tallies." />
  ),
});
