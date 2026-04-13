"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { formatDate } from "@/lib/utils/format";
import { getExerciseItemTypeLabelKey } from "@/lib/utils/exercise";
import type { WrongBookItemSummary } from "@/types/domain";

export function WrongBookItemCard({
  item,
  actions,
}: {
  item: WrongBookItemSummary;
  actions?: ReactNode;
}) {
  const { t } = useI18n();
  const prompt = item.sourceItem?.prompt ?? t("wrongBook.sourceUnavailable");
  const latestAnswer = item.latestAttempt?.submittedAnswer
    ? JSON.stringify(item.latestAttempt.submittedAnswer)
    : t("wrongBook.noSavedAnswer");

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-lg">{prompt}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {item.space?.title ?? t("wrongBook.classUnavailable")}
              {item.section ? ` / ${item.section.title}` : ""}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">{t("wrongBook.itemType")}</p>
            <p className="mt-1 font-medium text-slate-900">{item.sourceItem ? t(getExerciseItemTypeLabelKey(item.sourceItem.itemType)) : t("wrongBook.unknownType")}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">{t("wrongBook.latestWrong")}</p>
            <p className="mt-1 font-medium text-slate-900">{formatDate(item.latestWrongAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">{t("wrongBook.latestAnswer")}</p>
            <p className="mt-1 break-words font-medium text-slate-900">{latestAnswer}</p>
          </div>
        </div>
        {item.sourceItem?.explanation ? (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p className="font-medium">{t("wrongBook.teacherNote")}</p>
            <p className="mt-1 leading-6">{item.sourceItem.explanation}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600">
            {item.status === "mastered" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
            {item.status === "mastered" ? t("wrongBook.masteredOnRetry") : t("wrongBook.stillActive")}
          </div>
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
