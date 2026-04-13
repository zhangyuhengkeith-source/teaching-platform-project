"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";

export function PracticeSummaryCard({
  attempted,
  correct,
  incorrect,
}: {
  attempted: number;
  correct: number;
  incorrect: number;
}) {
  const { t } = useI18n();
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("practice.completionSummary")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">{t("practice.attempted")}</p>
          <p className="mt-1 text-2xl font-semibold">{attempted}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">{t("practice.correct")}</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{correct}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm text-amber-700">{t("practice.incorrect")}</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{incorrect}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-700">{t("practice.accuracy")}</p>
          <p className="mt-1 text-2xl font-semibold text-blue-900">{accuracy}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
