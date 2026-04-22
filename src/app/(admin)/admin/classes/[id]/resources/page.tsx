import { ClassModulePageShell } from "@/components/domain/class-module-page-shell";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";

export default async function CourseResourcesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace } = await requireClassManagementContext(id);

  return (
    <ClassModulePageShell
      classSpace={classSpace}
      createLabel="Create resource"
      emptyDescription="No course resources have been added for this class yet."
      emptyTitle="No resources"
      moduleDescription="Manage class slides, files, worksheets, and reference materials."
      moduleTitle="Course Resources"
    />
  );
}
