import { notFound } from "next/navigation";

import { ElectiveForm } from "@/components/domain/elective-form";
import { TaskCard } from "@/components/domain/task-card";
import { TaskForm } from "@/components/domain/task-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireRole } from "@/lib/auth/require-role";
import { getManageableElectiveById, listManageableTasksForElective } from "@/lib/queries/electives";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { FolderKanban } from "lucide-react";

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
      <PageHeader description="Update elective settings, grouping policy, and the published task list used by students." title={`Edit ${elective.title}`} />
      <SectionCard description="Core elective metadata and grouping rules." title="Elective settings">
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

      <SectionCard description="Create the next milestone or assignment for this elective." title="Add task">
        <TaskForm mode="create" resources={resources} spaceId={elective.id} />
      </SectionCard>

      <SectionCard description="Existing task workflow for this elective." title="Manage tasks">
        {tasks.length > 0 ? (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div className="space-y-4 rounded-2xl border border-border bg-slate-50/60 p-5" key={task.id}>
                <TaskCard task={task} />
                <TaskForm initialValues={{ ...task, id: task.id }} mode="edit" resources={resources} spaceId={elective.id} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description="No tasks have been created for this elective yet." icon={FolderKanban} title="No tasks yet" />
        )}
      </SectionCard>
    </div>
  );
}
