import { ClassModulePageShell } from "@/components/domain/class-module-page-shell";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";

export default async function CoursePracticeSetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace } = await requireClassManagementContext(id);

  return (
    <ClassModulePageShell
      classSpace={classSpace}
      createLabel="Create practice set"
      emptyDescription="No practice sets have been created for this class yet."
      emptyTitle="No practice sets"
      moduleDescription="Manage quizzes, flashcards, and recall practice for this class."
      moduleTitle="Course Practice Sets"
    />
  );
}
