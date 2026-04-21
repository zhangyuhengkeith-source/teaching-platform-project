"use client";

import type { ReactNode } from "react";

import { TranslationText } from "@/components/common/translation-text";
import { StudentChangeNotificationPopup } from "@/components/domain/student-change-notification-popup";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopNav } from "@/components/layout/top-nav";
import { useI18n } from "@/hooks/use-i18n";
import { getAppNavForProfile } from "@/lib/constants/nav";
import type { AppUserProfile } from "@/types/auth";

export function AppLayout({ children, profile }: { children: ReactNode; profile: AppUserProfile }) {
  const { t } = useI18n();
  const navItems = getAppNavForProfile(profile);

  return (
    <div className="min-h-screen bg-background">
      <TopNav actions={<MobileNavDrawer items={navItems} title={<TranslationText translationKey="nav.mobileNavigationTitle" />} />} items={navItems} title={profile.fullName} />
      <div className="flex">
        <SidebarNav items={navItems} title={t("layout.appNavigationTitle")} />
        <main className="min-w-0 flex-1">
          <div className="container-shell space-y-6 py-6">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
      <StudentChangeNotificationPopup enabled={profile.role === "student" && profile.userType === "internal"} />
    </div>
  );
}
