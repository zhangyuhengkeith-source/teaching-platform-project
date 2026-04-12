import { notFound } from "next/navigation";
import { Users } from "lucide-react";

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
      <PageHeader description="Review the group profile, leader, and member list for this elective project team." title={group.name} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard description="Current group snapshot." title="Group summary">
          <GroupSummaryPanel group={group} />
        </SectionCard>
        <SectionCard description="Teacher-managed group profile and status controls." title="Edit group">
          <GroupEditPanel
            initialValues={{
              id: group.id,
              name: group.name,
              slug: group.slug,
              project_title: group.projectTitle,
              project_summary: group.projectSummary,
              status: group.status,
            }}
            mode="edit"
            showStatusField
            spaceId={group.spaceId}
          />
        </SectionCard>
      </div>

      <SectionCard description="Remove non-leader members here when the roster needs correction." title="Members">
        <div className="space-y-4">
          {group.members.map((member) => (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4" key={member.id}>
              <div>
                <p className="font-medium text-slate-900">{member.profileName ?? member.profileId}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={member.memberRole === "leader" ? "primary" : "muted"}>{member.memberRole}</Badge>
                  <Badge variant="muted">{member.status}</Badge>
                </div>
              </div>
              {member.memberRole !== "leader" && member.status === "active" ? (
                <RemoveGroupMemberButton groupId={group.id} profileId={member.profileId} />
              ) : (
                <div className="text-sm text-muted-foreground">Leader changes are handled separately.</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
