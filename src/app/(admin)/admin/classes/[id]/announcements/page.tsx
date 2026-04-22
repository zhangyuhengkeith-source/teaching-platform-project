import { ClassAnnouncementsManager } from "@/components/domain/class-announcements-manager";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";
import { isAdminRole } from "@/lib/permissions/profiles";
import { listNoticesForSpace } from "@/lib/queries/notices";
import { isNonArchivedContentStatus } from "@/lib/status/content-status";

export default async function ClassAnnouncementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace, profile } = await requireClassManagementContext(id);
  const isAdmin = isAdminRole(profile);
  const notices = (await listNoticesForSpace(classSpace.id))
    .filter((notice) => notice.status !== "deleted")
    .filter((notice) => isAdmin || isNonArchivedContentStatus(notice.status));

  return (
    <ClassAnnouncementsManager
      classSpace={classSpace}
      isAdmin={isAdmin}
      notices={notices}
    />
  );
}
