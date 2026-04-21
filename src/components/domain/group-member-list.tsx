import { Crown, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatInShanghai } from "@/lib/utils/timezone";
import type { GroupMemberSummary } from "@/types/domain";

export function GroupMemberList({ members }: { members: GroupMemberSummary[] }) {
  const activeMembers = members.filter((member) => member.status === "active");

  return (
    <div className="space-y-3">
      {activeMembers.map((member) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{member.profileName ?? member.profileId}</p>
                <p className="text-sm text-muted-foreground">加入时间 {formatInShanghai(member.joinedAt, { year: "numeric", month: "2-digit", day: "2-digit" })}</p>
              </div>
            </div>
            {member.memberRole === "leader" ? (
              <Badge variant="primary">
                <Crown className="mr-1 h-3 w-3" />
                组长
              </Badge>
            ) : (
              <Badge variant="muted">成员</Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
