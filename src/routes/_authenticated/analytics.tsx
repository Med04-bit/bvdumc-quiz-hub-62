import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — BVDUMC Quiz Society" },
      { name: "description", content: "Participation, performance and question-difficulty insights." },
      { property: "og:title", content: "Analytics — BVDUMC Quiz Society" },
      { property: "og:description", content: "Participation, performance and question-difficulty insights." },
    ],
  }),
  component: () => (
    <ComingSoon title="Analytics" description="Participation, performance and question-difficulty insights." />
  ),
});
