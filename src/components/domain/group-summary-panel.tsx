import Link from "next/link";
import { FolderKanban, Users } from "lucide-react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupDetail } from "@/types/domain";

export function GroupSummaryPanel({
  group,
  actionHref,
  actionLabel = "打开小组空间",
}: {
  group: GroupDetail;
  actionHref?: string;
  actionLabel?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle>{group.name}</CardTitle>
          <StatusBadge status={group.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {group.projectSummary ?? "补充一段小组简介，便于老师和成员快速了解项目方向。"}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              {"成员人数"}
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{group.memberCount ?? group.members.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <FolderKanban className="h-4 w-4" />
              {"组长"}
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{group.leaderName ?? "未设置"}</p>
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
