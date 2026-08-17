import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/participants")({
  head: () => ({
    meta: [
      { title: "Participants — BVDUMC Quiz Society" },
      { name: "description", content: "Central register of everyone who competes in society quizzes." },
      { property: "og:title", content: "Participants — BVDUMC Quiz Society" },
      { property: "og:description", content: "Central register of everyone who competes in society quizzes." },
    ],
  }),
  component: () => (
    <ComingSoon title="Participants" description="Central register of everyone who competes in society quizzes." />
  ),
});
