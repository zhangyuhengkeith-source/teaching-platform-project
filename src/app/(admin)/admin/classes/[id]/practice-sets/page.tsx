import { ClassTeachingContentManager } from "@/components/domain/class-teaching-content-manager";
import { getPracticeSetProgressSummary } from "@/lib/analytics/practice-set-progress";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";
import { isAdminRole } from "@/lib/permissions/profiles";
import { listChapterOptionsForClass, listClassPracticeSets } from "@/repositories/class-teaching-content-repository";

export default async function CoursePracticeSetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace, profile } = await requireClassManagementContext(id);
  const [items, chapters, practiceSetProgress] = await Promise.all([
    listClassPracticeSets(classSpace.id, { mode: "published" }),
    listChapterOptionsForClass(classSpace.id),
    getPracticeSetProgressSummary(classSpace.id),
  ]);

  return (
    <ClassTeachingContentManager
      classSpace={classSpace}
      chapters={chapters}
      initialItems={items}
      isAdmin={isAdminRole(profile)}
      module="practice-sets"
      practiceSetProgress={practiceSetProgress}
    />
  );
}
