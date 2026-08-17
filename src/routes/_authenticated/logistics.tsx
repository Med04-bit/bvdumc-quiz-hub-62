import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/logistics")({
  head: () => ({
    meta: [
      { title: "Logistics — BVDUMC Quiz Society" },
      { name: "description", content: "Equipment, venue and volunteer duty planning for each event." },
      { property: "og:title", content: "Logistics — BVDUMC Quiz Society" },
      { property: "og:description", content: "Equipment, venue and volunteer duty planning for each event." },
    ],
  }),
  component: () => (
    <ComingSoon title="Logistics" description="Equipment, venue and volunteer duty planning for each event." />
  ),
});
