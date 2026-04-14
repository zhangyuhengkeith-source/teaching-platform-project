import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layout/admin-layout";
import { requireAdminUsersAccess } from "@/lib/auth/require-admin-users-access";

export const dynamic = "force-dynamic";

export default async function UserAdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireAdminUsersAccess();

  return <AdminLayout profile={profile}>{children}</AdminLayout>;
}
