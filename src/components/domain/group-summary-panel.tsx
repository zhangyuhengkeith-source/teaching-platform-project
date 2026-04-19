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
  actionLabel = "\u6253\u5f00\u5c0f\u7ec4\u7a7a\u95f4",
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
          {group.projectSummary ?? "\u8865\u5145\u4e00\u6bb5\u5c0f\u7ec4\u7b80\u4ecb\uff0c\u4fbf\u4e8e\u8001\u5e08\u548c\u6210\u5458\u5feb\u901f\u4e86\u89e3\u9879\u76ee\u65b9\u5411\u3002"}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              {"\u6210\u5458\u4eba\u6570"}
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{group.memberCount ?? group.members.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <FolderKanban className="h-4 w-4" />
              {"\u7ec4\u957f"}
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{group.leaderName ?? "\u672a\u8bbe\u7f6e"}</p>
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
