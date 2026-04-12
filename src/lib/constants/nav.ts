import {
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  NotebookPen,
  Shield,
  UserRound,
  Users,
  BarChart3,
  Settings,
  FolderKanban,
  Sparkles,
  ScrollText,
} from "lucide-react";

import type { NavItem } from "@/types/nav";
import { ROUTES } from "@/lib/constants/routes";

export const PUBLIC_NAV: NavItem[] = [
  { title: "Home", href: ROUTES.home },
  { title: "Essay Marking", href: ROUTES.essayMarking },
  { title: "Login", href: ROUTES.login },
  { title: "Register", href: ROUTES.register },
];

export const APP_NAV: NavItem[] = [
  { title: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: "Classes", href: ROUTES.classes, icon: GraduationCap },
  { title: "Electives", href: ROUTES.electives, icon: BookOpen },
  { title: "Service", href: ROUTES.service, icon: LifeBuoy },
  { title: "Notifications", href: ROUTES.notifications, icon: Bell },
  { title: "Profile", href: ROUTES.profile, icon: UserRound },
  { title: "Wrong Book", href: ROUTES.wrongBook, icon: NotebookPen },
];

export const ADMIN_NAV: NavItem[] = [
  { title: "Admin Home", href: ROUTES.admin, icon: Shield },
  { title: "Classes", href: "/admin/classes", icon: GraduationCap },
  { title: "Electives", href: "/admin/electives", icon: BookOpen },
  { title: "Resources", href: "/admin/resources", icon: FolderKanban },
  { title: "Notices", href: "/admin/notices", icon: Bell },
  { title: "Knowledge Points", href: "/admin/knowledge-points", icon: Sparkles, disabled: true },
  { title: "Exercises", href: "/admin/exercises", icon: ClipboardList },
  { title: "Groups", href: "/admin/groups", icon: Users },
  { title: "Submissions", href: "/admin/submissions", icon: ScrollText },
  { title: "Essay Orders", href: "/admin/essay-orders", icon: FileText, disabled: true },
  { title: "Users", href: "/admin/users", icon: UserRound, disabled: true },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3, disabled: true },
  { title: "Settings", href: "/admin/settings", icon: Settings, disabled: true },
];
