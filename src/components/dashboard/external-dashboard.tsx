"use client";

import { Button } from "@/components/ui/button";
import { externalMetrics } from "@/lib/constants/mock-data";
import { SectionCard } from "@/components/shared/section-card";
import { useI18n } from "@/hooks/use-i18n";

export function ExternalDashboard() {
  const { t } = useI18n();

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          {externalMetrics.map((item) => {
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
        <SectionCard description={t("dashboard.external.newSubmissionDescription")} title={t("dashboard.external.newSubmissionTitle")}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">{t("dashboard.external.newSubmissionBody")}</p>
            <Button>{t("dashboard.external.startSubmission")}</Button>
          </div>
        </SectionCard>
      </div>
      <SectionCard description={t("dashboard.external.serviceInstructionsDescription")} title={t("dashboard.external.serviceInstructionsTitle")}>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.external.instruction1")}</li>
          <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.external.instruction2")}</li>
          <li className="rounded-xl bg-slate-50 p-4">{t("dashboard.external.instruction3")}</li>
        </ul>
      </SectionCard>
    </div>
  );
}
