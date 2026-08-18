import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { EVENT_STATUSES, EVENT_STATUS_LABELS, type EventStatus } from "./EventStatusBadge";

export type EventMode = "ONLINE" | "OFFLINE";

export type EventRecord = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  online_platform: string | null;
  event_mode: EventMode;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  status: EventStatus;
};

type FormState = {
  name: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  event_mode: EventMode;
  venue: string;
  online_platform: string;
  registration_opens_at: string;
  registration_closes_at: string;
  status: EventStatus;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  event_date: "",
  start_time: "",
  end_time: "",
  event_mode: "OFFLINE",
  venue: "",
  online_platform: "",
  registration_opens_at: "",
  registration_closes_at: "",
  status: "DRAFT",
};

/** timestamptz -> value for <input type="datetime-local"> in local time */
export function toLocalInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function toForm(event: EventRecord): FormState {
  return {
    name: event.name,
    description: event.description ?? "",
    event_date: event.event_date,
    start_time: event.start_time?.slice(0, 5) ?? "",
    end_time: event.end_time?.slice(0, 5) ?? "",
    event_mode: event.event_mode,
    venue: event.venue ?? "",
    online_platform: event.online_platform ?? "",
    registration_opens_at: toLocalInput(event.registration_opens_at),
    registration_closes_at: toLocalInput(event.registration_closes_at),
    status: event.status,
  };
}

export function EventFormDialog({
  event,
  trigger,
}: {
  event?: EventRecord;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(event ? toForm(event) : EMPTY);
  const queryClient = useQueryClient();
  const isEdit = Boolean(event);

  useEffect(() => {
    if (open) setForm(event ? toForm(event) : EMPTY);
  }, [open, event]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        event_mode: form.event_mode,
        venue: form.event_mode === "OFFLINE" ? form.venue.trim() || null : null,
        online_platform: form.event_mode === "ONLINE" ? form.online_platform.trim() || null : null,
        registration_opens_at: fromLocalInput(form.registration_opens_at),
        registration_closes_at: fromLocalInput(form.registration_closes_at),
        status: form.status,
      };

      if (
        payload.registration_opens_at &&
        payload.registration_closes_at &&
        payload.registration_closes_at <= payload.registration_opens_at
      ) {
        throw new Error("Registration must close after it opens.");
      }

      if (isEdit) {
        const { error } = await supabase.from("events").update(payload).eq("id", event!.id);
        if (error) throw error;
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("events")
          .insert({ ...payload, created_by: auth.user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Event updated." : "Event created.");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the event."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the schedule, venue and registration window."
              : "Set up a new quiz competition for the society."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="event-name">Event name</Label>
            <Input
              id="event-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                required
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-start">Start time</Label>
              <Input
                id="event-start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">End time</Label>
              <Input
                id="event-end"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-mode">Event type</Label>
              <Select
                value={form.event_mode}
                onValueChange={(value) => setForm({ ...form, event_mode: value as EventMode })}
              >
                <SelectTrigger id="event-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.event_mode === "OFFLINE" ? (
              <div className="space-y-2">
                <Label htmlFor="event-venue">Venue</Label>
                <Input
                  id="event-venue"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="event-platform">Online platform</Label>
                <Input
                  id="event-platform"
                  placeholder="e.g. Zoom, Google Meet"
                  value={form.online_platform}
                  onChange={(e) => setForm({ ...form, online_platform: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reg-open">Registration opens</Label>
              <Input
                id="reg-open"
                type="datetime-local"
                value={form.registration_opens_at}
                onChange={(e) => setForm({ ...form, registration_opens_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-close">Registration closes</Label>
              <Input
                id="reg-close"
                type="datetime-local"
                value={form.registration_closes_at}
                onChange={(e) => setForm({ ...form, registration_closes_at: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as EventStatus })}
            >
              <SelectTrigger id="event-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {EVENT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
