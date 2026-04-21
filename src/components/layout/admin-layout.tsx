"use client";

import type { ReactNode } from "react";

import { AdminActionBar } from "@/components/layout/admin-action-bar";
import { TopNav } from "@/components/layout/top-nav";
import { useI18n } from "@/hooks/use-i18n";
import type { AppUserProfile } from "@/types/auth";

export function AdminLayout({ children, profile }: { children: ReactNode; profile: AppUserProfile }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav items={[]} title={`${profile.fullName} / ${t("layout.adminSuffix")}`} />
      <AdminActionBar />
      <main className="min-w-0">
        <div className="container-shell space-y-6 py-6">{children}</div>
      </main>
    </div>
  );
}
