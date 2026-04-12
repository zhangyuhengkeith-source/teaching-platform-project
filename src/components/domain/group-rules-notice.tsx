import { LockKeyhole, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GroupRulesNotice({
  maxGroupSize,
  groupingLocked,
}: {
  maxGroupSize?: number;
  groupingLocked?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grouping rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          One active group per student in this elective
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Maximum size: {maxGroupSize ?? 4} members
        </div>
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-primary" />
          {groupingLocked ? "Grouping is locked. Student create, join, and leave actions are disabled." : "Grouping is open. Leaders can maintain project title and summary."}
        </div>
        <Badge variant={groupingLocked ? "warning" : "success"}>{groupingLocked ? "Locked" : "Open"}</Badge>
      </CardContent>
    </Card>
  );
}
