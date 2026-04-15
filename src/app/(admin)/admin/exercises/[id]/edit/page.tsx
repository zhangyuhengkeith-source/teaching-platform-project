import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
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
      <PageHeader description={<TranslationText translationKey="admin.exercises.editDescription" />} title={<TranslationText translationKey="admin.exercises.editTitle" values={{ title: exerciseSet.title }} />} />
      <SectionCard description={<TranslationText translationKey="admin.exercises.builderDescription" />} title={<TranslationText translationKey="admin.exercises.builderTitle" />}>
        <ExerciseSetForm initialValues={exerciseSet} mode="edit" sections={sections} spaces={spaces} />
      </SectionCard>
    </div>
  );
}
