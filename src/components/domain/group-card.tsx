import type { ReactNode } from "react";
import { Users } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GroupCardProps {
  name: string;
  projectSummary?: string | null;
  leaderName?: string | null;
  memberCount?: number;
  maxGroupSize?: number;
  status: "forming" | "active" | "locked" | "archived";
  action?: ReactNode;
}

export function GroupCard({ name, projectSummary, leaderName, memberCount, maxGroupSize, status, action }: GroupCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base">{name}</CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{projectSummary ?? "Project direction has not been written yet."}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>Leader: {leaderName ?? "To be assigned"}</span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            {memberCount ?? 0}/{maxGroupSize ?? 4}
          </span>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
