import Link from "next/link";
import { FolderKanban, Users } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupDetail } from "@/types/domain";

export function GroupSummaryPanel({
  group,
  actionHref,
  actionLabel = "Open group workspace",
}: {
  group: GroupDetail;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{group.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{group.projectTitle ?? "Project title not set yet"}</p>
          </div>
          <StatusBadge status={group.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{group.projectSummary ?? "Add a concise summary so the teacher and group members have a shared project direction."}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              Members
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{group.memberCount ?? group.members.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <FolderKanban className="h-4 w-4" />
              Leader
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{group.leaderName ?? "Not set"}</p>
          </div>
        </div>
        {actionHref ? (
          <Button asChild variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
