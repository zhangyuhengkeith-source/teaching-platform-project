import { Bell } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { notificationsMock } from "@/lib/constants/mock-data";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader description="A simple notification center shell with realistic spacing and future-ready grouping." title="Notifications" />
      <SectionCard description="Recent updates from classes, services, and platform operations." title="Notification center">
        <div className="space-y-3">
          {notificationsMock.map((item) => (
            <div className="flex gap-4 rounded-xl bg-slate-50 p-4" key={item.title}>
              <div className="rounded-full bg-white p-2 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{item.title}</p>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

