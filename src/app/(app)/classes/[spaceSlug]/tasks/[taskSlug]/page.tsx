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
  const contextLabel = `Individual submission for ${profile.fullName}.`;

  return (
    <div className="space-y-6">
      <PageHeader description={task.brief ?? "Complete the class task, attach supporting files, and submit work for review."} title={task.title} />
      <TaskDetailPanel task={task} />

      {templateResource ? (
        <SectionCard description="Optional teacher-provided template or starting resource." title="Template resource">
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
        <EmptyState description="This class task is configured for group submission, which is not supported in the class workflow." icon={FileText} title="Unsupported task configuration" />
      ) : (
        <SectionCard description="Save a draft, upload attachments, and submit your work here." title="Submission">
          <SubmissionPanel canEdit={editable} contextLabel={contextLabel} submission={task.submission ?? null} task={task} />
        </SectionCard>
      )}

      {task.submission ? <SubmissionFeedbackPanel submission={task.submission} /> : null}
    </div>
  );
}
