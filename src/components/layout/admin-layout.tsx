"use client";

import type { ReactNode } from "react";

import { TranslationText } from "@/components/common/translation-text";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopNav } from "@/components/layout/top-nav";
import { useI18n } from "@/hooks/use-i18n";
import { ADMIN_NAV } from "@/lib/constants/nav";
import type { AppUserProfile } from "@/types/auth";

export function AdminLayout({ children, profile }: { children: ReactNode; profile: AppUserProfile }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav
        actions={<MobileNavDrawer items={ADMIN_NAV} title={<TranslationText translationKey="nav.mobileNavigationTitle" />} />}
        items={ADMIN_NAV.slice(0, 1)}
        title={`${profile.fullName} / ${t("layout.adminSuffix")}`}
      />
      <div className="flex">
        <SidebarNav compact items={ADMIN_NAV} title={t("layout.adminNavigationTitle")} />
        <main className="min-w-0 flex-1">
          <div className="container-shell space-y-6 py-6">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
