import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import type { TaskDetail } from "@/types/domain";

export function TaskDetailPanel({ task }: { task: TaskDetail }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted" className="capitalize">
            {task.submissionMode}
          </Badge>
          <Badge variant="primary">{task.status}</Badge>
        </div>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">Due date</p>
            <p className="mt-2 font-semibold text-slate-900">{formatDateTime(task.dueAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">Submission mode</p>
            <p className="mt-2 font-semibold capitalize text-slate-900">{task.submissionMode}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">Resubmission</p>
            <p className="mt-2 font-semibold text-slate-900">{task.allowResubmission ? "Allowed" : "Not allowed"}</p>
          </div>
        </div>
        {task.brief ? <p className="text-sm leading-6 text-slate-700">{task.brief}</p> : null}
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-slate-50/70 p-4 text-sm leading-7 text-muted-foreground">
          {task.body ?? "Detailed instructions have not been added yet."}
        </div>
      </CardContent>
    </Card>
  );
}
