import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import type { SubmissionMode } from "@/lib/constants/elective-types";
import type { TaskDetail } from "@/types/domain";

const SUBMISSION_MODE_LABELS: Record<SubmissionMode, string> = {
  group: "小组",
  individual: "个人",
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
            <p className="text-slate-500">{"截止时间"}</p>
            <p className="mt-2 font-semibold text-slate-900">{formatDateTime(task.dueAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">{"提交方式"}</p>
            <p className="mt-2 font-semibold text-slate-900">{SUBMISSION_MODE_LABELS[task.submissionMode]}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">{"是否允许再次提交"}</p>
            <p className="mt-2 font-semibold text-slate-900">{task.allowResubmission ? "允许" : "不允许"}</p>
          </div>
        </div>
        {task.brief ? <p className="text-sm leading-6 text-slate-700">{task.brief}</p> : null}
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-slate-50/70 p-4 text-sm leading-7 text-muted-foreground">
          {task.body ?? "教师暂时还没有补充更详细的任务说明。"}
        </div>
      </CardContent>
    </Card>
  );
}
