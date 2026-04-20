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
  const contextLabel = `个人提交：${profile.fullName}`;

  return (
    <div className="space-y-6">
      <PageHeader description={task.brief ?? "完成班级任务、补充附件，并提交给教师进行查看与反馈。"} title={task.title} />
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

      {task.submissionMode === "group" ? (
        <EmptyState description="这个班级任务被设置为小组提交，当前班级流程暂不支持该配置。" icon={FileText} title="暂不支持的任务配置" />
      ) : (
        <SectionCard description="你可以在这里保存草稿、上传附件并正式提交作业。" title="提交作业">
          <SubmissionPanel canEdit={editable} contextLabel={contextLabel} submission={task.submission ?? null} task={task} />
        </SectionCard>
      )}

      {task.submission ? <SubmissionFeedbackPanel submission={task.submission} /> : null}
    </div>
  );
}
