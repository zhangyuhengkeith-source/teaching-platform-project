import { ClassModulePageShell } from "@/components/domain/class-module-page-shell";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";

export default async function CourseTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace } = await requireClassManagementContext(id);

  return (
    <ClassModulePageShell
      classSpace={classSpace}
      createLabel="Create task"
      emptyDescription="No course tasks have been created for this class yet."
      emptyTitle="No tasks"
      moduleDescription="Manage homework, assignments, and class task workflows."
      moduleTitle="Course Tasks"
    />
  );
}
