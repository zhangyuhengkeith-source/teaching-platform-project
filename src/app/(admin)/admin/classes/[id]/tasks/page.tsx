import { ClassTeachingContentManager } from "@/components/domain/class-teaching-content-manager";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";
import { isAdminRole } from "@/lib/permissions/profiles";
import { listChapterOptionsForClass, listClassTasks } from "@/repositories/class-teaching-content-repository";

export default async function CourseTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace, profile } = await requireClassManagementContext(id);
  const [items, chapters] = await Promise.all([
    listClassTasks(classSpace.id, { mode: "published" }),
    listChapterOptionsForClass(classSpace.id),
  ]);

  return (
    <ClassTeachingContentManager
      classSpace={classSpace}
      chapters={chapters}
      initialItems={items}
      isAdmin={isAdminRole(profile)}
      module="tasks"
    />
  );
}
