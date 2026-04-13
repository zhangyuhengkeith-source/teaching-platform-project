"use client";

import type { SubmissionStatus } from "@/lib/constants/statuses";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils/cn";

const STEPS: SubmissionStatus[] = ["draft", "submitted", "returned", "resubmitted", "completed"];

const STEP_KEYS = {
  draft: "status.draft",
  submitted: "status.submitted",
  returned: "status.returned",
  resubmitted: "status.resubmitted",
  completed: "status.completed",
  overdue: "status.overdue",
} as const;

export function SubmissionStatusStepper({ status }: { status: SubmissionStatus }) {
  const activeIndex = STEPS.indexOf(status === "overdue" ? "draft" : status);
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap gap-2">
      {STEPS.map((step, index) => (
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium capitalize",
            index <= activeIndex ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-500",
          )}
          key={step}
        >
          {t(STEP_KEYS[step])}
        </div>
      ))}
      {status === "overdue" ? <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">{t("status.overdue")}</div> : null}
    </div>
  );
}
