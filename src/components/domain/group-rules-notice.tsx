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
        <CardTitle className="text-base">分组规则</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          每位学生在这门选修课中只能加入一个有效小组
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          小组人数上限：{maxGroupSize ?? 4} 人
        </div>
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-primary" />
          {groupingLocked ? "当前分组已锁定，学生不能创建、加入或退出小组。" : "当前分组开放中，组长可以维护项目标题与简介。"}
        </div>
        <Badge variant={groupingLocked ? "warning" : "success"}>{groupingLocked ? "已锁定" : "开放中"}</Badge>
      </CardContent>
    </Card>
  );
}
