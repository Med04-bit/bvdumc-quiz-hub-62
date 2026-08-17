import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — BVDUMC Quiz Society" },
      { name: "description", content: "Manage your society profile details and view your assigned roles." },
      { property: "og:title", content: "Settings — BVDUMC Quiz Society" },
      { property: "og:description", content: "Manage your society profile and roles." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: "", phone: "", year_of_study: "", institution: "" });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.fullName,
        phone: user.phone ?? "",
        year_of_study: user.yearOfStudy ?? "",
        institution: user.institution ?? "",
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          year_of_study: form.year_of_study.trim() || null,
          institution: form.institution.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save your profile."),
  });

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your society profile and access." />

      <section className="surface-panel max-w-2xl p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} readOnly disabled />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year of study</Label>
              <Input
                id="year"
                value={form.year_of_study}
                onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input
              id="institution"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>

      <section className="surface-panel max-w-2xl p-6">
        <h2 className="text-lg font-semibold">Your roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Roles control what you can see and change. Only society admins can assign roles.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(user?.roles ?? []).map((role) => (
            <Badge key={role} variant="secondary">
              {ROLE_LABELS[role]}
            </Badge>
          ))}
          {!user?.roles.length && <p className="text-sm text-muted-foreground">No roles assigned yet.</p>}
        </div>
      </section>
    </div>
  );
}
