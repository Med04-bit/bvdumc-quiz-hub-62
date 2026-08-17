import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ROLE_LABELS } from "@/lib/roles";
import { AppSidebar } from "./AppSidebar";

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initials = (user?.fullName ?? "M")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold sm:text-base">
          BVDUMC Quiz Society
        </p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          Quiz operations console
        </p>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You have no notifications yet. Alerts for events, reviews and scoring arrive in a later
            phase.
          </p>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
              {user?.fullName ?? "Member"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <p className="truncate text-sm font-semibold">{user?.fullName ?? "Member"}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(user?.roles ?? []).map((role) => (
                <Badge key={role} variant="secondary" className="text-[10px]">
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
            <User className="size-4" /> Profile & settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
