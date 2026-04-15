import { BarChart3, Bell, FilePenLine, Users } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

const stats = [
  { labelKey: "admin.home.stats.pendingWorkflows", value: "18", icon: FilePenLine },
  { labelKey: "admin.home.stats.activeUsers", value: "126", icon: Users },
  { labelKey: "admin.home.stats.unpublishedNotices", value: "3", icon: Bell },
  { labelKey: "admin.home.stats.weeklyCompletion", value: "84%", icon: BarChart3 },
] as const;

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.home.description" />} title={<TranslationText translationKey="admin.home.title" />} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <SectionCard description={<TranslationText translationKey="admin.home.metricPlaceholder" />} key={item.labelKey} title={<TranslationText translationKey={item.labelKey} />}>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold">{item.value}</p>
                <div className="rounded-xl bg-blue-50 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </SectionCard>
          );
        })}
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard description={<TranslationText translationKey="admin.home.pendingDescription" />} title={<TranslationText translationKey="admin.home.pendingTitle" />}>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-white p-4"><TranslationText translationKey="admin.home.pendingItems.essayOrders" /></li>
            <li className="rounded-xl bg-white p-4"><TranslationText translationKey="admin.home.pendingItems.assignments" /></li>
            <li className="rounded-xl bg-white p-4"><TranslationText translationKey="admin.home.pendingItems.groups" /></li>
          </ul>
        </SectionCard>
        <SectionCard description={<TranslationText translationKey="admin.home.quickLinksDescription" />} title={<TranslationText translationKey="admin.home.quickLinksTitle" />}>
          <div className="grid gap-3">
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600"><TranslationText translationKey="admin.home.quickLinks.submissions" /></div>
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600"><TranslationText translationKey="admin.home.quickLinks.essayOrders" /></div>
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600"><TranslationText translationKey="admin.home.quickLinks.notice" /></div>
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600"><TranslationText translationKey="admin.home.quickLinks.analytics" /></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
