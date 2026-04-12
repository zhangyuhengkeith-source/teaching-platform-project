"use client";

import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopNav } from "@/components/layout/top-nav";
import { APP_NAV } from "@/lib/constants/nav";
import type { AppUserProfile } from "@/types/auth";

export function AppLayout({ children, profile }: { children: ReactNode; profile: AppUserProfile }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav actions={<MobileNavDrawer items={APP_NAV} title="Student Navigation" />} items={APP_NAV} title={profile.fullName} />
      <div className="flex">
        <SidebarNav items={APP_NAV} title="Learning Space" />
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
