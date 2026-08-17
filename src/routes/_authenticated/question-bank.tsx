import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/question-bank")({
  head: () => ({
    meta: [
      { title: "Question Bank — BVDUMC Quiz Society" },
      { name: "description", content: "Authoring, review and approval workflow for quiz questions." },
      { property: "og:title", content: "Question Bank — BVDUMC Quiz Society" },
      { property: "og:description", content: "Authoring, review and approval workflow for quiz questions." },
    ],
  }),
  component: () => (
    <ComingSoon title="Question Bank" description="Authoring, review and approval workflow for quiz questions." />
  ),
});
