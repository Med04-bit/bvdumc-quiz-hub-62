import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type RoundStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ResultVisibility = "IMMEDIATE" | "AFTER_EVENT";

export type RoundRecord = {
  id: string;
  event_id: string;
  name: string;
  round_order: number;
  round_type: string | null;
  question_count: number;
  instructions: string | null;
  duration_minutes: number;
  total_marks: number;
  negative_marking: number;
  allow_backward_navigation: boolean;
  allow_answer_change: boolean;
  result_visibility: ResultVisibility;
  status: RoundStatus;
};

type FormState = {
  name: string;
  round_type: string;
  instructions: string;
  duration_minutes: string;
  total_marks: string;
  negative_marking: string;
  question_count: string;
  allow_backward_navigation: boolean;
  allow_answer_change: boolean;
  result_visibility: ResultVisibility;
};

const EMPTY: FormState = {
  name: "",
  round_type: "",
  instructions: "",
  duration_minutes: "15",
  total_marks: "0",
  negative_marking: "0",
  question_count: "0",
  allow_backward_navigation: true,
  allow_answer_change: true,
  result_visibility: "AFTER_EVENT",
};

function toForm(round: RoundRecord): FormState {
  return {
    name: round.name,
    round_type: round.round_type ?? "",
    instructions: round.instructions ?? "",
    duration_minutes: String(round.duration_minutes ?? 0),
    total_marks: String(round.total_marks ?? 0),
    negative_marking: String(round.negative_marking ?? 0),
    question_count: String(round.question_count ?? 0),
    allow_backward_navigation: round.allow_backward_navigation,
    allow_answer_change: round.allow_answer_change,
    result_visibility: round.result_visibility,
  };
}

export function RoundFormDialog({
  eventId,
  round,
  nextOrder,
  trigger,
}: {
  eventId: string;
  round?: RoundRecord;
  nextOrder?: number;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(round ? toForm(round) : EMPTY);
  const queryClient = useQueryClient();
  const isEdit = Boolean(round);

  useEffect(() => {
    if (open) setForm(round ? toForm(round) : EMPTY);
  }, [open, round]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        round_type: form.round_type.trim() || null,
        instructions: form.instructions.trim() || null,
        duration_minutes: Number(form.duration_minutes) || 0,
        total_marks: Number(form.total_marks) || 0,
        negative_marking: Number(form.negative_marking) || 0,
        question_count: Number(form.question_count) || 0,
        allow_backward_navigation: form.allow_backward_navigation,
        allow_answer_change: form.allow_answer_change,
        result_visibility: form.result_visibility,
      };

      if (isEdit) {
        const { error } = await supabase.from("event_rounds").update(payload).eq("id", round!.id);
        if (error) throw error;
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const { error } = await supabase.from("event_rounds").insert({
          ...payload,
          event_id: eventId,
          round_order: nextOrder ?? 1,
          status: "DRAFT",
          created_by: auth.user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Round updated." : "Round created as a draft.");
      queryClient.invalidateQueries({ queryKey: ["event-rounds", eventId] });
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the round."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit round" : "Create quiz round"}</DialogTitle>
          <DialogDescription>
            Rounds are saved as drafts and only go live once published.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="round-name">Round name</Label>
              <Input
                id="round-name"
                required
                placeholder="Round 1 — Preliminary"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-type">Round type</Label>
              <Input
                id="round-type"
                placeholder="Rapid fire, Clinical…"
                value={form.round_type}
                onChange={(e) => setForm({ ...form, round_type: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="round-instructions">Instructions</Label>
            <Textarea
              id="round-instructions"
              rows={3}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="round-duration">Duration (minutes)</Label>
              <Input
                id="round-duration"
                type="number"
                min={0}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-questions">Number of questions</Label>
              <Input
                id="round-questions"
                type="number"
                min={0}
                value={form.question_count}
                onChange={(e) => setForm({ ...form, question_count: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-marks">Total marks</Label>
              <Input
                id="round-marks"
                type="number"
                min={0}
                step="0.5"
                value={form.total_marks}
                onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-negative">Negative marking (per wrong answer)</Label>
              <Input
                id="round-negative"
                type="number"
                min={0}
                step="0.25"
                value={form.negative_marking}
                onChange={(e) => setForm({ ...form, negative_marking: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <ToggleRow
              id="round-back"
              label="Allow moving backwards between questions"
              checked={form.allow_backward_navigation}
              onChange={(v) => setForm({ ...form, allow_backward_navigation: v })}
            />
            <ToggleRow
              id="round-change"
              label="Allow participants to change answers"
              checked={form.allow_answer_change}
              onChange={(v) => setForm({ ...form, allow_answer_change: v })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="round-results">Show results</Label>
            <Select
              value={form.result_visibility}
              onValueChange={(value) =>
                setForm({ ...form, result_visibility: value as ResultVisibility })
              }
            >
              <SelectTrigger id="round-results">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMMEDIATE">Immediately after the round</SelectItem>
                <SelectItem value="AFTER_EVENT">After the event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Save as draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
