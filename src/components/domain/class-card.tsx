import Link from "next/link";
import { ArrowRight, BookOpen, CalendarRange } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Status } from "@/lib/constants/statuses";

interface ClassCardProps {
  title: string;
  description?: string | null;
  academicYear?: string | null;
  status?: Status;
  sectionCount?: number;
  resourceCount?: number;
  noticeCount?: number;
  href: string;
}

export function ClassCard({ title, description, academicYear, status, sectionCount, resourceCount, noticeCount, href }: ClassCardProps) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            {academicYear ? (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarRange className="h-4 w-4" />
                {academicYear}
              </div>
            ) : null}
          </div>
          {status ? <StatusBadge status={status} /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="min-h-12 text-sm leading-6 text-muted-foreground">{description ?? "A class space ready for structured teaching materials and notices."}</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-slate-500">Sections</p>
            <p className="mt-1 font-semibold text-slate-900">{sectionCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-slate-500">Resources</p>
            <p className="mt-1 font-semibold text-slate-900">{resourceCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-slate-500">Notices</p>
            <p className="mt-1 font-semibold text-slate-900">{noticeCount ?? 0}</p>
          </div>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" href={href}>
          Open class
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

