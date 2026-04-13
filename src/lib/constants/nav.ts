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
  { titleKey: "nav.home", href: ROUTES.home },
  { titleKey: "nav.essayMarking", href: ROUTES.essayMarking },
  { titleKey: "nav.login", href: ROUTES.login },
  { titleKey: "nav.register", href: ROUTES.register },
];

export const APP_NAV: NavItem[] = [
  { titleKey: "nav.dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { titleKey: "nav.classes", href: ROUTES.classes, icon: GraduationCap },
  { titleKey: "nav.electives", href: ROUTES.electives, icon: BookOpen },
  { titleKey: "nav.service", href: ROUTES.service, icon: LifeBuoy },
  { titleKey: "nav.notifications", href: ROUTES.notifications, icon: Bell },
  { titleKey: "nav.profile", href: ROUTES.profile, icon: UserRound },
  { titleKey: "nav.wrongBook", href: ROUTES.wrongBook, icon: NotebookPen },
];

export const ADMIN_NAV: NavItem[] = [
  { titleKey: "nav.adminHome", href: ROUTES.admin, icon: Shield },
  { titleKey: "nav.classes", href: "/admin/classes", icon: GraduationCap },
  { titleKey: "nav.electives", href: "/admin/electives", icon: BookOpen },
  { titleKey: "nav.resources", href: "/admin/resources", icon: FolderKanban },
  { titleKey: "nav.notices", href: "/admin/notices", icon: Bell },
  { titleKey: "nav.knowledgePoints", href: "/admin/knowledge-points", icon: Sparkles, disabled: true },
  { titleKey: "nav.exercises", href: "/admin/exercises", icon: ClipboardList },
  { titleKey: "nav.groups", href: "/admin/groups", icon: Users },
  { titleKey: "nav.submissions", href: "/admin/submissions", icon: ScrollText },
  { titleKey: "nav.essayOrders", href: "/admin/essay-orders", icon: FileText, disabled: true },
  { titleKey: "nav.users", href: "/admin/users", icon: UserRound, disabled: true },
  { titleKey: "nav.analytics", href: "/admin/analytics", icon: BarChart3, disabled: true },
  { titleKey: "nav.settings", href: "/admin/settings", icon: Settings, disabled: true },
];
