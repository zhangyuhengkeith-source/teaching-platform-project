import { CourseChaptersManager } from "@/components/domain/course-chapters-manager";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";
import { isAdminRole } from "@/lib/permissions/profiles";
import {
  listCourseChapterSetsByClassId,
  listCourseChapterTemplates,
} from "@/repositories/course-chapter-repository";

export default async function CourseChaptersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace, profile } = await requireClassManagementContext(id);
  const [chapterSets, templates] = await Promise.all([
    listCourseChapterSetsByClassId(classSpace.id, {
      includeArchived: isAdminRole(profile),
    }),
    listCourseChapterTemplates(),
  ]);

  return (
    <CourseChaptersManager
      classSpace={classSpace}
      currentUserId={profile.id}
      initialChapterSets={chapterSets}
      initialTemplates={templates}
      isAdmin={isAdminRole(profile)}
    />
  );
}
