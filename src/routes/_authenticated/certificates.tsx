import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates — BVDUMC Quiz Society" },
      { name: "description", content: "Certificate generation, serial numbers and distribution." },
      { property: "og:title", content: "Certificates — BVDUMC Quiz Society" },
      { property: "og:description", content: "Certificate generation, serial numbers and distribution." },
    ],
  }),
  component: () => (
    <ComingSoon title="Certificates" description="Certificate generation, serial numbers and distribution." />
  ),
});
