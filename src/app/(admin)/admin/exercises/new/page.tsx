import { notFound } from "next/navigation";

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
      <PageHeader description="Create a practice set and build the item sequence in the same workflow." title="Create Exercise Set" />
      <SectionCard description="Supported item types in this MVP are MCQ, term recall, and flashcards." title="Exercise builder">
        <ExerciseSetForm mode="create" sections={sections} spaces={spaces} />
      </SectionCard>
    </div>
  );
}
