import { ClassModulePageShell } from "@/components/domain/class-module-page-shell";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";

export default async function CourseChaptersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace } = await requireClassManagementContext(id);

  return (
    <ClassModulePageShell
      classSpace={classSpace}
      createLabel="Create chapter"
      emptyDescription="No course chapters have been created for this class yet."
      emptyTitle="No chapters"
      moduleDescription="Manage chapter structure and class course organization."
      moduleTitle="Course Chapters"
    />
  );
}
