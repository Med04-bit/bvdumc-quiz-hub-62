import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  Radio,
  Settings,
  Trophy,
  Users,
  UsersRound,
  MonitorPlay,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** false = placeholder module for a later phase */
  available: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, available: true },
  { label: "Events", to: "/events", icon: CalendarDays, available: true },
  { label: "Participants", to: "/participants", icon: Users, available: false },
  { label: "Teams", to: "/teams", icon: UsersRound, available: false },
  { label: "Question Bank", to: "/question-bank", icon: BookOpen, available: false },
  { label: "Online Quiz", to: "/online-quiz", icon: MonitorPlay, available: false },
  { label: "Live Quiz", to: "/live-quiz", icon: Radio, available: false },
  { label: "Scorekeeper", to: "/scorekeeper", icon: ClipboardCheck, available: false },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy, available: false },
  { label: "Certificates", to: "/certificates", icon: Award, available: false },
  { label: "Logistics", to: "/logistics", icon: Package, available: false },
  { label: "Analytics", to: "/analytics", icon: BarChart3, available: false },
  { label: "Settings", to: "/settings", icon: Settings, available: true },
];
