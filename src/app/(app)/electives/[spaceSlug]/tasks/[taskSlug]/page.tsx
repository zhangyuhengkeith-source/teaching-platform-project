import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { SubmissionFeedbackPanel } from "@/components/domain/submission-feedback-panel";
import { SubmissionPanel } from "@/components/domain/submission-panel";
import { TaskDetailPanel } from "@/components/domain/task-detail-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAccessibleElectiveBySlug } from "@/lib/auth/require-elective-access";
import { canEditSubmission } from "@/lib/permissions/electives";
import { getGroupForUserInElective, getTaskBySlugForUser } from "@/lib/queries/electives";
import { getResourceById } from "@/lib/queries/resources";
import { ResourceCard } from "@/components/domain/resource-card";

export default async function ElectiveTaskPage({
  params,
}: {
  params: Promise<{ spaceSlug: string; taskSlug: string }>;
}) {
  const { spaceSlug, taskSlug } = await params;
  const { profile, space } = await requireAccessibleElectiveBySlug(spaceSlug);
  const task = await getTaskBySlugForUser(spaceSlug, taskSlug, profile);

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
        ? `Group submission for ${group.name}${group.leaderProfileId === profile.id ? " as group leader" : ""}.`
        : "This is a group task. Join a group before submitting work."
      : `Individual submission for ${profile.fullName}.`;

  return (
    <div className="space-y-6">
      <PageHeader description={task.brief ?? "Complete the task, save drafts, and submit work for teacher review."} title={task.title} />
      <TaskDetailPanel task={task} />

      {templateResource ? (
        <SectionCard description="Optional teacher-provided template or starting resource." title="Template resource">
          <ResourceCard
            description={templateResource.description}
            resourceType={templateResource.resourceType}
            status={templateResource.status}
            title={templateResource.title}
            updatedAt={templateResource.updatedAt}
            visibility={templateResource.visibility}
          />
        </SectionCard>
      ) : null}

      {task.submissionMode === "group" && !group && !editable ? (
        <EmptyState description="Join a group in this elective before you can start the submission workflow for this task." icon={FileText} title="Group required" />
      ) : (
        <SectionCard description="Save a draft, submit, and review returned feedback here." title="Submission">
          <SubmissionPanel canEdit={editable} contextLabel={contextLabel} submission={task.submission ?? null} task={task} />
        </SectionCard>
      )}

      {task.submission ? <SubmissionFeedbackPanel submission={task.submission} /> : null}
    </div>
  );
}
