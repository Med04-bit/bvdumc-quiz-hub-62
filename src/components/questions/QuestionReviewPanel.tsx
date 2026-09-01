import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageSquareWarning, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDate,
  VERDICT_LABELS,
  type QuestionRecord,
  type ReviewVerdict,
} from "@/lib/questions";

type ReviewRow = {
  id: string;
  verdict: ReviewVerdict;
  comments: string | null;
  created_at: string;
  reviewer_id: string | null;
  version_number: number;
};

export function QuestionReviewPanel({
  question,
  canReview,
}: {
  question: QuestionRecord;
  canReview: boolean;
}) {
  const [comment, setComment] = useState("");
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["question-reviews", question.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_reviews")
        .select("id, verdict, comments, created_at, reviewer_id, version_number")
        .eq("question_id", question.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const review = useMutation({
    mutationFn: async (verdict: ReviewVerdict) => {
      if (verdict !== "APPROVED" && !comment.trim()) {
        throw new Error(
          verdict === "REJECTED"
            ? "A reason is required when rejecting a question."
            : "Please describe the changes you are requesting.",
        );
      }

      const { error: reviewError } = await supabase.from("question_reviews").insert({
        question_id: question.id,
        reviewer_id: user?.id ?? null,
        verdict,
        comments: comment.trim() || null,
        version_number: question.version_number,
      });
      if (reviewError) throw reviewError;

      const nextStatus =
        verdict === "APPROVED"
          ? "APPROVED"
          : verdict === "REJECTED"
            ? "REJECTED"
            : "CHANGES_REQUESTED";

      const { error } = await supabase
        .from("questions")
        .update({
          status: nextStatus,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", question.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review recorded.");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["question", question.id] });
      queryClient.invalidateQueries({ queryKey: ["question-reviews", question.id] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["question-stats"] });
      queryClient.invalidateQueries({ queryKey: ["question-versions", question.id] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not record the review."),
  });

  const reviews = historyQuery.data ?? [];

  return (
    <section className="surface-panel space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {canReview
            ? "Approve, request changes or reject. Every decision is stored permanently."
            : "You can see the review history for this question but cannot review it."}
        </p>
      </div>

      {canReview && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="review-comment">
              Review comment (required to request changes or reject)
            </Label>
            <Textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What needs to change, or why is this rejected?"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={review.isPending} onClick={() => review.mutate("APPROVED")}>
              <CheckCircle2 className="size-4" /> Approve
            </Button>
            <Button
              variant="outline"
              disabled={review.isPending}
              onClick={() => review.mutate("CHANGES_REQUESTED")}
            >
              <MessageSquareWarning className="size-4" /> Request changes
            </Button>
            <Button
              variant="destructive"
              disabled={review.isPending}
              onClick={() => review.mutate("REJECTED")}
            >
              <XCircle className="size-4" /> Reject
            </Button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold">Review history</h3>
        {historyQuery.isLoading && <Skeleton className="mt-3 h-16 w-full" />}
        {!historyQuery.isLoading && reviews.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No reviews recorded yet.</p>
        )}
        <ul className="mt-3 space-y-2">
          {reviews.map((entry) => (
            <li key={entry.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{VERDICT_LABELS[entry.verdict] ?? entry.verdict}</Badge>
                <span className="text-xs text-muted-foreground">
                  Version {entry.version_number} · {formatDate(entry.created_at)}
                </span>
              </div>
              {entry.comments && <p className="mt-2 text-sm whitespace-pre-wrap">{entry.comments}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
