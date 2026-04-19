import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { GroupEditPanel } from "@/components/domain/group-edit-panel";
import { GroupSummaryPanel } from "@/components/domain/group-summary-panel";
import { RemoveGroupMemberButton } from "@/components/domain/group-membership-actions";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/require-role";
import { getGroupById, getManageableElectiveById } from "@/lib/queries/electives";

export default async function AdminGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole(["super_admin", "teacher"]);
  const group = await getGroupById(id);

  if (!group) {
    notFound();
  }

  const elective = await getManageableElectiveById(group.spaceId, profile);
  if (!elective) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.groups.detailDescription" />} title={group.name} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard description={<TranslationText translationKey="admin.groups.summaryDescription" />} title={<TranslationText translationKey="admin.groups.summaryTitle" />}>
          <GroupSummaryPanel group={group} />
        </SectionCard>
        <SectionCard description={<TranslationText translationKey="admin.groups.editDescription" />} title={<TranslationText translationKey="admin.groups.editTitle" />}>
          <GroupEditPanel
            initialValues={{
              id: group.id,
              name: group.name,
              slug: group.slug,
              project_summary: group.projectSummary,
              status: group.status,
            }}
            mode="edit"
            showStatusField
            spaceId={group.spaceId}
          />
        </SectionCard>
      </div>

      <SectionCard description={<TranslationText translationKey="admin.groups.membersDescription" />} title={<TranslationText translationKey="admin.groups.membersTitle" />}>
        <div className="space-y-4">
          {group.members.map((member) => (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4" key={member.id}>
              <div>
                <p className="font-medium text-slate-900">{member.profileName ?? member.profileId}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={member.memberRole === "leader" ? "primary" : "muted"}>
                    <TranslationText translationKey={member.memberRole === "leader" ? "admin.groupMembers.leader" : "admin.groupMembers.member"} />
                  </Badge>
                  <Badge variant="muted"><TranslationText translationKey={member.status === "active" ? "status.active" : "admin.groupMembers.removed"} /></Badge>
                </div>
              </div>
              {member.memberRole !== "leader" && member.status === "active" ? (
                <RemoveGroupMemberButton groupId={group.id} profileId={member.profileId} />
              ) : (
                <div className="text-sm text-muted-foreground"><TranslationText translationKey="admin.groups.leaderLocked" /></div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
