import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoundFormDialog, type RoundRecord, type RoundStatus } from "./RoundFormDialog";

const ROUND_FIELDS =
  "id, event_id, name, round_order, round_type, question_count, instructions, duration_minutes, total_marks, negative_marking, allow_backward_navigation, allow_answer_change, result_visibility, status";

const STATUS_STYLES: Record<RoundStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-success/15 text-success",
  ARCHIVED: "bg-muted text-muted-foreground line-through",
};

export function EventRoundsPanel({ eventId, canManage }: { eventId: string; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<RoundRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["event-rounds", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rounds")
        .select(ROUND_FIELDS)
        .eq("event_id", eventId)
        .order("round_order", { ascending: true });
      if (error) throw error;
      return data as unknown as RoundRecord[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["event-rounds", eventId] });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RoundStatus }) => {
      const { error } = await supabase.from("event_rounds").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Round updated.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || "Could not update the round."),
  });

  const reorder = useMutation({
    mutationFn: async ({ a, b }: { a: RoundRecord; b: RoundRecord }) => {
      const [r1, r2] = await Promise.all([
        supabase.from("event_rounds").update({ round_order: b.round_order }).eq("id", a.id),
        supabase.from("event_rounds").update({ round_order: a.round_order }).eq("id", b.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message || "Could not reorder the rounds."),
  });

  const rounds = data ?? [];
  const nextOrder = rounds.length ? Math.max(...rounds.map((r) => r.round_order)) + 1 : 1;

  return (
    <section className="surface-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Quizzes & rounds</h2>
          <p className="text-sm text-muted-foreground">
            Structure this event into rounds and publish them when ready.
          </p>
        </div>
        {canManage && (
          <RoundFormDialog
            eventId={eventId}
            nextOrder={nextOrder}
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Add round
              </Button>
            }
          />
        )}
      </div>

      {isLoading && <Skeleton className="mt-4 h-24 w-full rounded-lg" />}

      {!isLoading && rounds.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No rounds yet.{canManage ? " Add the first round to get started." : ""}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rounds.map((round, index) => (
          <li key={round.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{round.round_order}</span>
                  <h3 className="font-medium">{round.name}</h3>
                  <Badge variant="outline" className={`border-transparent ${STATUS_STYLES[round.status]}`}>
                    {round.status.charAt(0) + round.status.slice(1).toLowerCase()}
                  </Badge>
                  {round.round_type && (
                    <span className="text-xs text-muted-foreground">{round.round_type}</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {round.question_count} questions · {round.duration_minutes} min ·{" "}
                  {round.total_marks} marks
                  {Number(round.negative_marking) > 0 ? ` · −${round.negative_marking} per wrong` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setPreview(round)}>
                  <Eye className="size-4" /> Preview
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move up"
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => reorder.mutate({ a: round, b: rounds[index - 1]! })}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Move down"
                      disabled={index === rounds.length - 1 || reorder.isPending}
                      onClick={() => reorder.mutate({ a: round, b: rounds[index + 1]! })}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <RoundFormDialog
                      eventId={eventId}
                      round={round}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Edit round">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    {round.status !== "PUBLISHED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: round.id, status: "PUBLISHED" })}
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: round.id, status: "DRAFT" })}
                      >
                        Unpublish
                      </Button>
                    )}
                    {round.status !== "ARCHIVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: round.id, status: "ARCHIVED" })}
                      >
                        Archive
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>How this round is configured for participants.</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 text-sm">
              {preview.instructions && (
                <p className="whitespace-pre-line text-muted-foreground">{preview.instructions}</p>
              )}
              <dl className="grid gap-2 sm:grid-cols-2">
                <PreviewRow label="Questions" value={String(preview.question_count)} />
                <PreviewRow label="Duration" value={`${preview.duration_minutes} minutes`} />
                <PreviewRow label="Total marks" value={String(preview.total_marks)} />
                <PreviewRow label="Negative marking" value={String(preview.negative_marking)} />
                <PreviewRow
                  label="Move backwards"
                  value={preview.allow_backward_navigation ? "Allowed" : "Not allowed"}
                />
                <PreviewRow
                  label="Change answers"
                  value={preview.allow_answer_change ? "Allowed" : "Not allowed"}
                />
                <PreviewRow
                  label="Results"
                  value={preview.result_visibility === "IMMEDIATE" ? "Immediately" : "After the event"}
                />
                <PreviewRow label="State" value={preview.status.toLowerCase()} />
              </dl>
              <p className="text-xs text-muted-foreground">
                The participant quiz interface itself arrives in a later phase.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
