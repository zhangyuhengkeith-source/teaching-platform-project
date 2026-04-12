import { notFound } from "next/navigation";

import { ExerciseSetForm } from "@/components/domain/exercise-set-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireRole } from "@/lib/auth/require-role";
import { getManageableExerciseSetById } from "@/lib/queries/exercises";
import { listManageableClasses, listSectionsForSpace } from "@/lib/queries/spaces";

export default async function EditExerciseSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole(["super_admin", "teacher"]);
  const [exerciseSet, spaces] = await Promise.all([getManageableExerciseSetById(id, profile), listManageableClasses(profile)]);

  if (!exerciseSet) {
    notFound();
  }

  const sections = (await Promise.all(spaces.map((space) => listSectionsForSpace(space.id)))).flat();

  return (
    <div className="space-y-6">
      <PageHeader description="Update exercise metadata and rebuild the item sequence as needed." title={`Edit ${exerciseSet.title}`} />
      <SectionCard description="Changes here affect the student-facing practice player immediately after publishing." title="Exercise builder">
        <ExerciseSetForm initialValues={exerciseSet} mode="edit" sections={sections} spaces={spaces} />
      </SectionCard>
    </div>
  );
}
