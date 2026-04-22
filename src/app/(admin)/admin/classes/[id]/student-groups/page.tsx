import { ClassStudentGroupsManager } from "@/components/domain/class-student-groups-manager";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";
import { isAdminRole } from "@/lib/permissions/profiles";
import {
  ensureAutoGroupingForDueRule,
  getLatestClassGroupingRule,
  listClassGroups,
  listClassStudentsWithGroupState,
} from "@/repositories/class-group-repository";

export default async function StudentGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace, profile } = await requireClassManagementContext(id);
  await ensureAutoGroupingForDueRule(classSpace.id);
  const [groups, rule, students] = await Promise.all([
    listClassGroups(classSpace.id, { includeArchived: false }),
    getLatestClassGroupingRule(classSpace.id),
    listClassStudentsWithGroupState(classSpace.id),
  ]);

  return (
    <ClassStudentGroupsManager
      classSpace={classSpace}
      initialGroups={groups}
      initialRule={rule}
      initialStudents={students}
      isAdmin={isAdminRole(profile)}
    />
  );
}
