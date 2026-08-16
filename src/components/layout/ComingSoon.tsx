import { Construction } from "lucide-react";
import { PageHeader } from "./PageHeader";

export function ComingSoon({
  title,
  description,
  phase = "a later phase",
}: {
  title: string;
  description: string;
  phase?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="surface-panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Construction className="size-6" />
        </span>
        <h2 className="text-lg font-semibold">Coming in {phase}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This module is part of the roadmap and is intentionally not built yet. The foundation
          (database tables, roles and access rules) is already in place so it can be added safely.
        </p>
      </div>
    </div>
  );
}
