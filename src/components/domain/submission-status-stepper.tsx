import type { SubmissionStatus } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils/cn";

const STEPS: SubmissionStatus[] = ["draft", "submitted", "returned", "resubmitted", "completed"];

export function SubmissionStatusStepper({ status }: { status: SubmissionStatus }) {
  const activeIndex = STEPS.indexOf(status === "overdue" ? "draft" : status);

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
          {step}
        </div>
      ))}
      {status === "overdue" ? <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">overdue</div> : null}
    </div>
  );
}
