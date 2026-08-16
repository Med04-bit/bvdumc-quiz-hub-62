import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Permission } from "@/lib/roles";
import { hasPermission } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  institution: string | null;
  yearOfStudy: string | null;
  roles: AppRole[];
};

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", auth.user.id),
  ]);

  return {
    id: auth.user.id,
    email: auth.user.email ?? null,
    fullName: profile?.full_name?.trim() || auth.user.email?.split("@")[0] || "Member",
    avatarUrl: profile?.avatar_url ?? null,
    phone: profile?.phone ?? null,
    institution: profile?.institution ?? null,
    yearOfStudy: profile?.year_of_study ?? null,
    roles: (roleRows ?? []).map((r) => r.role as AppRole),
  };
}

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });

  const roles = query.data?.roles ?? [];

  return {
    ...query,
    user: query.data ?? null,
    roles,
    can: (permission: Permission) => hasPermission(roles, permission),
  };
}
