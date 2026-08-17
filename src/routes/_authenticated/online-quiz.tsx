import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/online-quiz")({
  head: () => ({
    meta: [
      { title: "Online Quiz — BVDUMC Quiz Society" },
      { name: "description", content: "Timed online quiz engine for prelims and screening rounds." },
      { property: "og:title", content: "Online Quiz — BVDUMC Quiz Society" },
      { property: "og:description", content: "Timed online quiz engine for prelims and screening rounds." },
    ],
  }),
  component: () => (
    <ComingSoon title="Online Quiz" description="Timed online quiz engine for prelims and screening rounds." />
  ),
});
