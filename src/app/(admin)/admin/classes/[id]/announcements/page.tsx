import { ClassModulePageShell } from "@/components/domain/class-module-page-shell";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";

export default async function ClassAnnouncementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace } = await requireClassManagementContext(id);

  return (
    <ClassModulePageShell
      classSpace={classSpace}
      createLabel="Create announcement"
      emptyDescription="No announcements have been created for this class yet."
      emptyTitle="No announcements"
      moduleDescription="Manage class announcements, reminders, and scheduled notices."
      moduleTitle="Class Announcements"
    />
  );
}
