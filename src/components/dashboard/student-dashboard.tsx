"use client";

import { studentMetrics } from "@/lib/constants/mock-data";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useI18n } from "@/hooks/use-i18n";

export function StudentDashboard() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {studentMetrics.map((item) => {
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
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <SectionCard description={t("dashboard.student.continueLearningDescription")} title={t("dashboard.student.continueLearningTitle")}>
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{t("dashboard.student.learningCardTitle")}</p>
                <StatusBadge status="active" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.student.learningCardDescription")}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{t("dashboard.student.wrongBookCardTitle")}</p>
                <StatusBadge status="pending" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.student.wrongBookCardDescription")}</p>
            </div>
          </div>
        </SectionCard>
        <SectionCard description={t("dashboard.student.latestNoticesDescription")} title={t("dashboard.student.latestNoticesTitle")}>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.student.notice1")}</li>
            <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.student.notice2")}</li>
            <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.student.notice3")}</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
