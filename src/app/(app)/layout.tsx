import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function StudentAppLayout({ children }: { children: ReactNode }) {
  const profile = await requireAuth();

  return <AppLayout profile={profile}>{children}</AppLayout>;
}
