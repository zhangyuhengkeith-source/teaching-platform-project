import Link from "next/link";
import { CalendarClock, Users } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import type { TaskSummary } from "@/types/domain";

export function TaskCard({
  task,
  href,
  actionLabel = "Open task",
}: {
  task: TaskSummary;
  href?: string;
  actionLabel?: string;
}) {
  const content = (
    <>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-base">{task.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="muted" className="capitalize">
                {task.submissionMode}
              </Badge>
              <StatusBadge status={task.status} />
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{task.brief ?? "Task brief will appear here once the teacher writes it."}</p>
        <p className="inline-flex items-center gap-2 text-xs text-slate-400">
          <CalendarClock className="h-4 w-4" />
          Due {formatDateTime(task.dueAt)}
        </p>
        {href ? <span className="text-sm font-medium text-primary">{actionLabel}</span> : null}
      </CardContent>
    </>
  );

  return href ? (
    <Link href={href}>
      <Card className="h-full transition hover:border-blue-200 hover:shadow-md">{content}</Card>
    </Link>
  ) : (
    <Card>{content}</Card>
  );
}
