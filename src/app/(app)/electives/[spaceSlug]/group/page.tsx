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
      <PageHeader description="创建、加入并管理这门选修课对应的项目小组。" title={`${space.title} 小组`} />
      <GroupRulesNotice groupingLocked={space.groupingLocked} maxGroupSize={space.maxGroupSize} />

      {currentGroup ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard description="你当前所在的小组与项目协作信息。" title="当前小组">
            <div className="space-y-6">
              <GroupSummaryPanel group={currentGroup} />
              {canLeaveGroup(profile, currentGroup, { space, memberships }) ? <LeaveGroupButton groupId={currentGroup.id} /> : null}
            </div>
          </SectionCard>
          <SectionCard description="如果你是组长或授课教师，可以在这里修改小组资料。" title="小组资料">
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
              <EmptyState description="只有组长或负责该选修课的教师可以编辑小组资料。" icon={Users} title="当前为只读模式" />
            )}
          </SectionCard>
          <SectionCard className="xl:col-span-2" description="当前小组中的有效成员列表。" title="成员">
            <GroupMemberList members={currentGroup.members} />
          </SectionCard>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard description="如果你想自定项目方向，可以先创建一个新小组。" title="创建小组">
            {canParticipate ? (
              <GroupEditPanel groupCodeProfileId={profile.id} mode="create" spaceId={space.id} />
            ) : (
              <EmptyState description="当前分组已锁定，或你的身份暂时不能在这门选修课中创建小组。" icon={Users} title="暂时无法创建小组" />
            )}
          </SectionCard>
          <SectionCard description="如果其他小组还有名额，可以直接加入现有小组。" title="可加入的小组">
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
              <EmptyState description="当前还没有可加入的小组。你可以先创建第一个小组。" icon={Users} title="暂无小组" />
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
