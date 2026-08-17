import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/live-quiz")({
  head: () => ({
    meta: [
      { title: "Live Quiz — BVDUMC Quiz Society" },
      { name: "description", content: "Quizmaster console for on-stage offline quiz rounds." },
      { property: "og:title", content: "Live Quiz — BVDUMC Quiz Society" },
      { property: "og:description", content: "Quizmaster console for on-stage offline quiz rounds." },
    ],
  }),
  component: () => (
    <ComingSoon title="Live Quiz" description="Quizmaster console for on-stage offline quiz rounds." />
  ),
});
