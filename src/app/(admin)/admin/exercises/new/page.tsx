import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
import { ExerciseSetForm } from "@/components/domain/exercise-set-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireRole } from "@/lib/auth/require-role";
import { listManageableClasses, listSectionsForSpace } from "@/lib/queries/spaces";

export default async function NewExerciseSetPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const spaces = await listManageableClasses(profile);

  if (spaces.length === 0) {
    notFound();
  }

  const sections = (await Promise.all(spaces.map((space) => listSectionsForSpace(space.id)))).flat();

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.exercises.newDescription" />} title={<TranslationText translationKey="admin.exercises.newTitle" />} />
      <SectionCard description={<TranslationText translationKey="admin.exercises.newBuilderDescription" />} title={<TranslationText translationKey="admin.exercises.builderTitle" />}>
        <ExerciseSetForm mode="create" sections={sections} spaces={spaces} />
      </SectionCard>
    </div>
  );
}
