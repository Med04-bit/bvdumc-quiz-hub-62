import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  subtitle = true,
  tone = "dark",
}: {
  className?: string;
  subtitle?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border",
          tone === "dark"
            ? "border-sidebar-border bg-sidebar-accent text-sidebar-primary"
            : "border-border bg-secondary text-primary",
        )}
      >
        <GraduationCap className="size-5" />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-display text-sm font-semibold tracking-wide uppercase",
            tone === "dark" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          BVDUMC Quiz Society
        </p>
        {subtitle && (
          <p
            className={cn(
              "truncate text-[11px]",
              tone === "dark" ? "text-sidebar-foreground/60" : "text-muted-foreground",
            )}
          >
            Bharati Vidyapeeth (DU) Medical College, Pune
          </p>
        )}
      </div>
    </div>
  );
}
