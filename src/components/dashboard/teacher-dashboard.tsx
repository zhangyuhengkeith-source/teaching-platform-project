"use client";

import { Button } from "@/components/ui/button";
import { teacherMetrics } from "@/lib/constants/mock-data";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useI18n } from "@/hooks/use-i18n";

export function TeacherDashboard() {
  const { t } = useI18n();

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          {teacherMetrics.map((item) => {
            const Icon = item.icon;
            return (
              <SectionCard description={t(item.detailKey)} key={item.labelKey} title={t(item.labelKey)}>
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
        <SectionCard description={t("dashboard.teacher.recentNoticesDescription")} title={t("dashboard.teacher.recentNoticesTitle")}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-medium">{t("dashboard.teacher.noticeCard1Title")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.teacher.noticeCard1Description")}</p>
              </div>
              <StatusBadge status="published" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-medium">{t("dashboard.teacher.noticeCard2Title")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.teacher.noticeCard2Description")}</p>
              </div>
              <StatusBadge status="pending" />
            </div>
          </div>
        </SectionCard>
      </div>
      <div className="space-y-6">
        <SectionCard description={t("dashboard.teacher.quickActionsDescription")} title={t("dashboard.teacher.quickActionsTitle")}>
          <div className="grid gap-3">
            <Button className="justify-start" variant="outline">{t("dashboard.teacher.reviewEssayQueue")}</Button>
            <Button className="justify-start" variant="outline">{t("dashboard.teacher.postNotice")}</Button>
            <Button className="justify-start" variant="outline">{t("dashboard.teacher.adjustElectiveGroups")}</Button>
          </div>
        </SectionCard>
        <SectionCard description={t("dashboard.teacher.upcomingDeadlinesDescription")} title={t("dashboard.teacher.upcomingDeadlinesTitle")}>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.teacher.deadline1")}</li>
            <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.teacher.deadline2")}</li>
            <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.teacher.deadline3")}</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
