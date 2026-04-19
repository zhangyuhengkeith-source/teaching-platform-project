import Link from "next/link";
import { ArrowRight, BookOpenText, Users } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Status } from "@/lib/constants/statuses";

interface ElectiveCardProps {
  title: string;
  description?: string | null;
  academicYear?: string | null;
  status?: Status;
  groupCount?: number;
  taskCount?: number;
  href: string;
}

export function ElectiveCard({ title, description, academicYear, status, groupCount, taskCount, href }: ElectiveCardProps) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            {academicYear ? <p className="text-sm text-muted-foreground">{academicYear}</p> : null}
          </div>
          {status ? <StatusBadge status={status} /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="min-h-12 text-sm leading-6 text-muted-foreground">{description ?? "用于项目协作、阶段任务与教师指导的选修课空间。"}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              小组
            </div>
            <p className="mt-1 font-semibold text-slate-900">{groupCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-slate-500">
              <BookOpenText className="h-4 w-4" />
              任务
            </div>
            <p className="mt-1 font-semibold text-slate-900">{taskCount ?? 0}</p>
          </div>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" href={href}>
          进入选修课
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
