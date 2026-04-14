import { Bell } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { notificationsMock } from "@/lib/constants/mock-data";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="notificationsPage.description" />}
        title={<TranslationText translationKey="notificationsPage.title" />}
      />
      <SectionCard
        description={<TranslationText translationKey="notificationsPage.centerDescription" />}
        title={<TranslationText translationKey="notificationsPage.centerTitle" />}
      >
        <div className="space-y-3">
          {notificationsMock.map((item) => (
            <div className="flex gap-4 rounded-xl bg-slate-50 p-4" key={item.titleKey}>
              <div className="rounded-full bg-white p-2 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">
                    <TranslationText translationKey={item.titleKey} />
                  </p>
                  <span className="text-xs text-slate-400">
                    <TranslationText translationKey={item.timeKey} />
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <TranslationText translationKey={item.detailKey} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
