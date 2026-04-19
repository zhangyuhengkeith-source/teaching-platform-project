import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { SubmissionFeedbackPanel } from "@/components/domain/submission-feedback-panel";
import { SubmissionPanel } from "@/components/domain/submission-panel";
import { TaskDetailPanel } from "@/components/domain/task-detail-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAccessibleElectiveBySlug } from "@/lib/auth/require-elective-access";
import { canEditSubmission } from "@/lib/permissions/tasks";
import { getGroupForUserInElective } from "@/lib/queries/electives";
import { getResourceById } from "@/lib/queries/resources";
import { getTaskBySlugForElective } from "@/lib/queries/tasks";
import { ResourceCard } from "@/components/domain/resource-card";

export default async function ElectiveTaskPage({
  params,
}: {
  params: Promise<{ spaceSlug: string; taskSlug: string }>;
}) {
  const { spaceSlug, taskSlug } = await params;
  const { profile, space } = await requireAccessibleElectiveBySlug(spaceSlug);
  const task = await getTaskBySlugForElective(spaceSlug, taskSlug, profile);

  if (!task) {
    notFound();
  }

  const [group, templateResource] = await Promise.all([
    getGroupForUserInElective(space.id, profile.id),
    task.templateResourceId ? getResourceById(task.templateResourceId) : Promise.resolve(null),
  ]);

  const memberships = space.memberships ?? [];
  const editable = canEditSubmission(profile, task.submission ?? null, group, task, { space, memberships });
  const contextLabel =
    task.submissionMode === "group"
      ? group
        ? `\u5c0f\u7ec4\u63d0\u4ea4\uff1a${group.name}${group.leaderProfileId === profile.id ? "\uff08\u4f60\u662f\u7ec4\u957f\uff09" : ""}`
        : "\u8fd9\u662f\u5c0f\u7ec4\u4efb\u52a1\uff0c\u8bf7\u5148\u52a0\u5165\u5c0f\u7ec4\u540e\u518d\u63d0\u4ea4\u3002"
      : `\u4e2a\u4eba\u63d0\u4ea4\uff1a${profile.fullName}`;

  return (
    <div className="space-y-6">
      <PageHeader description={task.brief ?? "\u5b8c\u6210\u4efb\u52a1\u3001\u4fdd\u5b58\u8349\u7a3f\uff0c\u5e76\u5c06\u4f5c\u54c1\u63d0\u4ea4\u7ed9\u6559\u5e08\u67e5\u770b\u4e0e\u53cd\u9988\u3002"} title={task.title} />
      <TaskDetailPanel task={task} />

      {templateResource ? (
        <SectionCard description="\u6559\u5e08\u63d0\u4f9b\u7684\u53ef\u9009\u6a21\u677f\u6216\u8d77\u59cb\u53c2\u8003\u8d44\u6e90\u3002" title="\u4efb\u52a1\u6a21\u677f\u8d44\u6e90">
          <ResourceCard
            description={templateResource.description}
            files={templateResource.files}
            resourceId={templateResource.id}
            resourceType={templateResource.resourceType}
            status={templateResource.status}
            title={templateResource.title}
            updatedAt={templateResource.updatedAt}
            visibility={templateResource.visibility}
          />
        </SectionCard>
      ) : null}

      {task.submissionMode === "group" && !group && !editable ? (
        <EmptyState description="\u8fd9\u4e2a\u4efb\u52a1\u9700\u8981\u4ee5\u5c0f\u7ec4\u5f62\u5f0f\u63d0\u4ea4\uff0c\u8bf7\u5148\u52a0\u5165\u672c\u9009\u4fee\u8bfe\u4e2d\u7684\u4e00\u4e2a\u5c0f\u7ec4\u3002" icon={FileText} title="\u9700\u8981\u5148\u52a0\u5165\u5c0f\u7ec4" />
      ) : (
        <SectionCard description="\u4f60\u53ef\u4ee5\u5728\u8fd9\u91cc\u4fdd\u5b58\u8349\u7a3f\u3001\u6b63\u5f0f\u63d0\u4ea4\uff0c\u5e76\u67e5\u770b\u8001\u5e08\u9000\u56de\u7684\u53cd\u9988\u3002" title="\u63d0\u4ea4\u4f5c\u4e1a">
          <SubmissionPanel canEdit={editable} contextLabel={contextLabel} submission={task.submission ?? null} task={task} />
        </SectionCard>
      )}

      {task.submission ? <SubmissionFeedbackPanel submission={task.submission} /> : null}
    </div>
  );
}
