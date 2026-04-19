import { Users } from "lucide-react";

import { GroupCard } from "@/components/domain/group-card";
import { GroupEditPanel } from "@/components/domain/group-edit-panel";
import { GroupMemberList } from "@/components/domain/group-member-list";
import { GroupRulesNotice } from "@/components/domain/group-rules-notice";
import { JoinGroupButton, LeaveGroupButton } from "@/components/domain/group-membership-actions";
import { GroupSummaryPanel } from "@/components/domain/group-summary-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { canCreateOrJoinGroup, canEditGroup, canLeaveGroup, canManageElective } from "@/lib/permissions/electives";
import { requireAccessibleElectiveBySlug } from "@/lib/auth/require-elective-access";
import { getGroupForUserInElective, listGroupsForElective } from "@/lib/queries/electives";

export default async function ElectiveGroupPage({
  params,
}: {
  params: Promise<{ spaceSlug: string }>;
}) {
  const { spaceSlug } = await params;
  const { profile, space } = await requireAccessibleElectiveBySlug(spaceSlug);
  const [currentGroup, groups] = await Promise.all([getGroupForUserInElective(space.id, profile.id), listGroupsForElective(space.id, profile)]);
  const memberships = space.memberships ?? [];
  const canManage = canManageElective(profile, { space, memberships });
  const canParticipate = canCreateOrJoinGroup(profile, { space, memberships });

  return (
    <div className="space-y-6">
      <PageHeader description="\u521b\u5efa\u3001\u52a0\u5165\u5e76\u7ba1\u7406\u8fd9\u95e8\u9009\u4fee\u8bfe\u5bf9\u5e94\u7684\u9879\u76ee\u5c0f\u7ec4\u3002" title={`${space.title} \u5c0f\u7ec4`} />
      <GroupRulesNotice groupingLocked={space.groupingLocked} maxGroupSize={space.maxGroupSize} />

      {currentGroup ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard description="\u4f60\u5f53\u524d\u6240\u5728\u7684\u5c0f\u7ec4\u4e0e\u9879\u76ee\u534f\u4f5c\u4fe1\u606f\u3002" title="\u5f53\u524d\u5c0f\u7ec4">
            <div className="space-y-6">
              <GroupSummaryPanel group={currentGroup} />
              {canLeaveGroup(profile, currentGroup, { space, memberships }) ? <LeaveGroupButton groupId={currentGroup.id} /> : null}
            </div>
          </SectionCard>
          <SectionCard description="\u5982\u679c\u4f60\u662f\u7ec4\u957f\u6216\u6388\u8bfe\u6559\u5e08\uff0c\u53ef\u4ee5\u5728\u8fd9\u91cc\u4fee\u6539\u5c0f\u7ec4\u8d44\u6599\u3002" title="\u5c0f\u7ec4\u8d44\u6599">
            {canEditGroup(profile, currentGroup, { space, memberships }) ? (
              <GroupEditPanel
                initialValues={{
                  id: currentGroup.id,
                  name: currentGroup.name,
                  project_summary: currentGroup.projectSummary,
                  status: currentGroup.status,
                }}
                mode="edit"
                showStatusField={canManage}
                spaceId={space.id}
              />
            ) : (
              <EmptyState description="\u53ea\u6709\u7ec4\u957f\u6216\u8d1f\u8d23\u8be5\u9009\u4fee\u8bfe\u7684\u6559\u5e08\u53ef\u4ee5\u7f16\u8f91\u5c0f\u7ec4\u8d44\u6599\u3002" icon={Users} title="\u5f53\u524d\u4e3a\u53ea\u8bfb\u6a21\u5f0f" />
            )}
          </SectionCard>
          <SectionCard className="xl:col-span-2" description="\u5f53\u524d\u5c0f\u7ec4\u4e2d\u7684\u6709\u6548\u6210\u5458\u5217\u8868\u3002" title="\u6210\u5458">
            <GroupMemberList members={currentGroup.members} />
          </SectionCard>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard description="\u5982\u679c\u4f60\u60f3\u81ea\u5b9a\u9879\u76ee\u65b9\u5411\uff0c\u53ef\u4ee5\u5148\u521b\u5efa\u4e00\u4e2a\u65b0\u5c0f\u7ec4\u3002" title="\u521b\u5efa\u5c0f\u7ec4">
            {canParticipate ? (
              <GroupEditPanel groupCodeProfileId={profile.id} mode="create" spaceId={space.id} />
            ) : (
              <EmptyState description="\u5f53\u524d\u5206\u7ec4\u5df2\u9501\u5b9a\uff0c\u6216\u4f60\u7684\u8eab\u4efd\u6682\u65f6\u4e0d\u80fd\u5728\u8fd9\u95e8\u9009\u4fee\u8bfe\u4e2d\u521b\u5efa\u5c0f\u7ec4\u3002" icon={Users} title="\u6682\u65f6\u65e0\u6cd5\u521b\u5efa\u5c0f\u7ec4" />
            )}
          </SectionCard>
          <SectionCard description="\u5982\u679c\u5176\u4ed6\u5c0f\u7ec4\u8fd8\u6709\u540d\u989d\uff0c\u53ef\u4ee5\u76f4\u63a5\u52a0\u5165\u73b0\u6709\u5c0f\u7ec4\u3002" title="\u53ef\u52a0\u5165\u7684\u5c0f\u7ec4">
            {groups.length > 0 ? (
              <div className="space-y-4">
                {groups.map((group) => (
                  <GroupCard
                    action={canParticipate ? <JoinGroupButton groupId={group.id} /> : null}
                    key={group.id}
                    leaderName={group.leaderName}
                    maxGroupSize={space.maxGroupSize}
                    memberCount={group.memberCount}
                    name={group.name}
                    projectSummary={group.projectSummary}
                    status={group.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyState description="\u5f53\u524d\u8fd8\u6ca1\u6709\u53ef\u52a0\u5165\u7684\u5c0f\u7ec4\u3002\u4f60\u53ef\u4ee5\u5148\u521b\u5efa\u7b2c\u4e00\u4e2a\u5c0f\u7ec4\u3002" icon={Users} title="\u6682\u65e0\u5c0f\u7ec4" />
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
