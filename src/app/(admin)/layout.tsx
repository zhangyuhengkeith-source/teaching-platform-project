import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layout/admin-layout";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function TeacherAdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole(["super_admin", "teacher"]);

  return <AdminLayout profile={profile}>{children}</AdminLayout>;
}
