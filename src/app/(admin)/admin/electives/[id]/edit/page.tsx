import { notFound } from "next/navigation";
import { FolderKanban } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { ElectiveForm } from "@/components/domain/elective-form";
import { TaskCard } from "@/components/domain/task-card";
import { TaskForm } from "@/components/domain/task-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireRole } from "@/lib/auth/require-role";
import { getManageableElectiveById } from "@/lib/queries/electives";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { listManageableTasksForElective } from "@/lib/queries/tasks";

export default async function EditElectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole(["super_admin", "teacher"]);
  const elective = await getManageableElectiveById(id, profile);

  if (!elective) {
    notFound();
  }

  const [tasks, resources] = await Promise.all([listManageableTasksForElective(elective.id, profile), listResourcesForSpace(elective.id)]);

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.electives.editDescription" />} title={<TranslationText translationKey="admin.electives.editTitle" values={{ title: elective.title }} />} />
      <SectionCard description={<TranslationText translationKey="admin.electives.settingsDescription" />} title={<TranslationText translationKey="admin.electives.settingsTitle" />}>
        <ElectiveForm
          initialValues={{
            id: elective.id,
            title: elective.title,
            slug: elective.slug,
            description: elective.description,
            academic_year: elective.academicYear,
            status: elective.status,
            grouping_locked: elective.groupingLocked,
            max_group_size: elective.maxGroupSize,
          }}
          mode="edit"
        />
      </SectionCard>

      <SectionCard description={<TranslationText translationKey="admin.electives.addTaskDescription" />} title={<TranslationText translationKey="admin.electives.addTaskTitle" />}>
        <TaskForm mode="create" resources={resources} spaceId={elective.id} spaceType="elective" />
      </SectionCard>

      <SectionCard description={<TranslationText translationKey="admin.electives.tasksDescription" />} title={<TranslationText translationKey="admin.electives.tasksTitle" />}>
        {tasks.length > 0 ? (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div className="space-y-4 rounded-2xl border border-border bg-slate-50/60 p-5" key={task.id}>
                <TaskCard task={task} />
                <TaskForm initialValues={{ ...task, id: task.id }} mode="edit" resources={resources} spaceId={elective.id} spaceType="elective" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description={<TranslationText translationKey="admin.electives.emptyTasksDescription" />} icon={FolderKanban} title={<TranslationText translationKey="admin.electives.emptyTasksTitle" />} />
        )}
      </SectionCard>
    </div>
  );
}
