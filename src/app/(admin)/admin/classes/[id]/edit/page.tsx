import { notFound } from "next/navigation";
import { FolderKanban } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { ClassForm } from "@/components/domain/class-form";
import { TaskCard } from "@/components/domain/task-card";
import { TaskForm } from "@/components/domain/task-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { getManageableClassById } from "@/lib/queries/spaces";
import { listManageableTasksForSpace } from "@/lib/queries/tasks";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const item = await getManageableClassById(id, profile);

  if (!item) {
    notFound();
  }

  const [tasks, resources] = await Promise.all([listManageableTasksForSpace(item.id, profile), listResourcesForSpace(item.id)]);

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.classes.editDescription" />} title={<TranslationText translationKey="admin.classes.editTitle" values={{ title: item.title }} />} />
      <SectionCard description={<TranslationText translationKey="admin.classes.detailsDescription" />} title={<TranslationText translationKey="admin.classes.detailsTitle" />}>
        <ClassForm
          initialValues={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            type: item.type,
            description: item.description ?? "",
            academic_year: item.academicYear ?? "",
            status: item.status,
          }}
          mode="edit"
        />
      </SectionCard>

      <SectionCard description="Add a class task with deadlines, instructions, and optional template resources." title="Add task">
        <TaskForm mode="create" resources={resources} spaceId={item.id} spaceType="class" />
      </SectionCard>

      <SectionCard description="Update or remove existing class tasks here." title="Manage tasks">
        {tasks.length > 0 ? (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div className="space-y-4 rounded-2xl border border-border bg-slate-50/60 p-5" key={task.id}>
                <TaskCard task={task} />
                <TaskForm initialValues={{ ...task, id: task.id }} mode="edit" resources={resources} spaceId={item.id} spaceType="class" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description="No class tasks have been created yet." icon={FolderKanban} title="No tasks yet" />
        )}
      </SectionCard>
    </div>
  );
}
