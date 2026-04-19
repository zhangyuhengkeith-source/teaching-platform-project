import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import type { SubmissionMode } from "@/lib/constants/elective-types";
import type { TaskDetail } from "@/types/domain";

const SUBMISSION_MODE_LABELS: Record<SubmissionMode, string> = {
  group: "\u5c0f\u7ec4",
  individual: "\u4e2a\u4eba",
};

export function TaskDetailPanel({ task }: { task: TaskDetail }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{SUBMISSION_MODE_LABELS[task.submissionMode]}</Badge>
          <StatusBadge status={task.status} />
        </div>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">{"\u622a\u6b62\u65f6\u95f4"}</p>
            <p className="mt-2 font-semibold text-slate-900">{formatDateTime(task.dueAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">{"\u63d0\u4ea4\u65b9\u5f0f"}</p>
            <p className="mt-2 font-semibold text-slate-900">{SUBMISSION_MODE_LABELS[task.submissionMode]}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">{"\u662f\u5426\u5141\u8bb8\u518d\u6b21\u63d0\u4ea4"}</p>
            <p className="mt-2 font-semibold text-slate-900">{task.allowResubmission ? "\u5141\u8bb8" : "\u4e0d\u5141\u8bb8"}</p>
          </div>
        </div>
        {task.brief ? <p className="text-sm leading-6 text-slate-700">{task.brief}</p> : null}
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-slate-50/70 p-4 text-sm leading-7 text-muted-foreground">
          {task.body ?? "\u6559\u5e08\u6682\u65f6\u8fd8\u6ca1\u6709\u8865\u5145\u66f4\u8be6\u7ec6\u7684\u4efb\u52a1\u8bf4\u660e\u3002"}
        </div>
      </CardContent>
    </Card>
  );
}
