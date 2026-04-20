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
        ? `小组提交：${group.name}${group.leaderProfileId === profile.id ? "（你是组长）" : ""}`
        : "这是小组任务，请先加入小组后再提交。"
      : `个人提交：${profile.fullName}`;

  return (
    <div className="space-y-6">
      <PageHeader description={task.brief ?? "完成任务、保存草稿，并将作品提交给教师查看与反馈。"} title={task.title} />
      <TaskDetailPanel task={task} />

      {templateResource ? (
        <SectionCard description="教师提供的可选模板或起始参考资源。" title="任务模板资源">
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
        <EmptyState description="这个任务需要以小组形式提交，请先加入本选修课中的一个小组。" icon={FileText} title="需要先加入小组" />
      ) : (
        <SectionCard description="你可以在这里保存草稿、正式提交，并查看老师退回的反馈。" title="提交作业">
          <SubmissionPanel canEdit={editable} contextLabel={contextLabel} submission={task.submission ?? null} task={task} />
        </SectionCard>
      )}

      {task.submission ? <SubmissionFeedbackPanel submission={task.submission} /> : null}
    </div>
  );
}
