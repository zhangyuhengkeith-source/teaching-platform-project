import { ClassModulePageShell } from "@/components/domain/class-module-page-shell";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";

export default async function StudentGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace } = await requireClassManagementContext(id);

  return (
    <ClassModulePageShell
      classSpace={classSpace}
      createLabel="Create group"
      emptyDescription="No student groups have been created for this class yet."
      emptyTitle="No student groups"
      moduleDescription="Manage student groups and class collaboration rosters."
      moduleTitle="Student Groups"
    />
  );
}
