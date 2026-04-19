import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { ResourceCard } from "@/components/domain/resource-card";
import { SubmissionFeedbackPanel } from "@/components/domain/submission-feedback-panel";
import { SubmissionPanel } from "@/components/domain/submission-panel";
import { TaskDetailPanel } from "@/components/domain/task-detail-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAccessibleClassBySlug } from "@/lib/auth/require-class-access";
import { canEditSubmission } from "@/lib/permissions/tasks";
import { getResourceById } from "@/lib/queries/resources";
import { getTaskBySlugForClass } from "@/lib/queries/tasks";

export default async function ClassTaskPage({
  params,
}: {
  params: Promise<{ spaceSlug: string; taskSlug: string }>;
}) {
  const { spaceSlug, taskSlug } = await params;
  const { profile, space } = await requireAccessibleClassBySlug(spaceSlug);
  const task = await getTaskBySlugForClass(spaceSlug, taskSlug, profile);

  if (!task) {
    notFound();
  }

  const templateResource = task.templateResourceId ? await getResourceById(task.templateResourceId) : null;
  const memberships = space.memberships ?? [];
  const editable = canEditSubmission(profile, task.submission ?? null, null, task, { space, memberships });
  const contextLabel = `\u4e2a\u4eba\u63d0\u4ea4\uff1a${profile.fullName}`;

  return (
    <div className="space-y-6">
      <PageHeader description={task.brief ?? "\u5b8c\u6210\u73ed\u7ea7\u4efb\u52a1\u3001\u8865\u5145\u9644\u4ef6\uff0c\u5e76\u63d0\u4ea4\u7ed9\u6559\u5e08\u8fdb\u884c\u67e5\u770b\u4e0e\u53cd\u9988\u3002"} title={task.title} />
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

      {task.submissionMode === "group" ? (
        <EmptyState description="\u8fd9\u4e2a\u73ed\u7ea7\u4efb\u52a1\u88ab\u8bbe\u7f6e\u4e3a\u5c0f\u7ec4\u63d0\u4ea4\uff0c\u5f53\u524d\u73ed\u7ea7\u6d41\u7a0b\u6682\u4e0d\u652f\u6301\u8be5\u914d\u7f6e\u3002" icon={FileText} title="\u6682\u4e0d\u652f\u6301\u7684\u4efb\u52a1\u914d\u7f6e" />
      ) : (
        <SectionCard description="\u4f60\u53ef\u4ee5\u5728\u8fd9\u91cc\u4fdd\u5b58\u8349\u7a3f\u3001\u4e0a\u4f20\u9644\u4ef6\u5e76\u6b63\u5f0f\u63d0\u4ea4\u4f5c\u4e1a\u3002" title="\u63d0\u4ea4\u4f5c\u4e1a">
          <SubmissionPanel canEdit={editable} contextLabel={contextLabel} submission={task.submission ?? null} task={task} />
        </SectionCard>
      )}

      {task.submission ? <SubmissionFeedbackPanel submission={task.submission} /> : null}
    </div>
  );
}
