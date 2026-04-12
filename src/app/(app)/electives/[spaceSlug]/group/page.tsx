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
      <PageHeader description="Create, join, and manage the project group attached to this elective course." title={`${space.title} Group`} />
      <GroupRulesNotice groupingLocked={space.groupingLocked} maxGroupSize={space.maxGroupSize} />

      {currentGroup ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard description="Your current project group in this elective." title="Current group">
            <div className="space-y-6">
              <GroupSummaryPanel group={currentGroup} />
              {canLeaveGroup(profile, currentGroup, { space, memberships }) ? <LeaveGroupButton groupId={currentGroup.id} /> : null}
            </div>
          </SectionCard>
          <SectionCard description="Edit the group profile if you are the leader or a managing teacher." title="Group profile">
            {canEditGroup(profile, currentGroup, { space, memberships }) ? (
              <GroupEditPanel
                initialValues={{
                  id: currentGroup.id,
                  name: currentGroup.name,
                  slug: currentGroup.slug,
                  project_title: currentGroup.projectTitle,
                  project_summary: currentGroup.projectSummary,
                  status: currentGroup.status,
                }}
                mode="edit"
                showStatusField={canManage}
                spaceId={space.id}
              />
            ) : (
              <EmptyState description="Only the group leader or the managing teacher can edit the group profile." icon={Users} title="Read-only group profile" />
            )}
          </SectionCard>
          <SectionCard className="xl:col-span-2" description="Current active members in the group." title="Members">
            <GroupMemberList members={currentGroup.members} />
          </SectionCard>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard description="Create a new group if you want to define your own project direction." title="Create group">
            {canParticipate ? (
              <GroupEditPanel mode="create" spaceId={space.id} />
            ) : (
              <EmptyState description="Grouping is currently locked or your role cannot create groups in this elective." icon={Users} title="Group creation unavailable" />
            )}
          </SectionCard>
          <SectionCard description="Join an existing group if the leader still has open slots." title="Available groups">
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
                    projectTitle={group.projectTitle}
                    status={group.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyState description="No groups are available yet. Create the first group to start the elective workflow." icon={Users} title="No groups yet" />
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
