import { notFound } from "next/navigation";

import { PracticePlayer } from "@/components/domain/practice-player";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireClassViewer } from "@/lib/auth/require-class-access";
import { getExerciseSetWithItemsForUser } from "@/lib/queries/exercises";
import { getExerciseSetTypeLabel } from "@/lib/utils/exercise";

export default async function PracticeSetPage({
  params,
}: {
  params: Promise<{ spaceSlug: string; exerciseSlug: string }>;
}) {
  const { spaceSlug, exerciseSlug } = await params;
  const profile = await requireClassViewer();
  const exerciseSet = await getExerciseSetWithItemsForUser(spaceSlug, exerciseSlug, profile);

  if (!exerciseSet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={exerciseSet.instructions ?? "Complete each item in order and review the result before moving on."}
        title={exerciseSet.title}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard description="Practice mode" title="Type">
          <p className="text-lg font-semibold">{getExerciseSetTypeLabel(exerciseSet.exerciseType)}</p>
        </SectionCard>
        <SectionCard description="Total question count" title="Items">
          <p className="text-lg font-semibold">{exerciseSet.items.length}</p>
        </SectionCard>
        <SectionCard description="Linked section" title="Section">
          <p className="text-lg font-semibold">{exerciseSet.section?.title ?? "Class-wide practice"}</p>
        </SectionCard>
      </section>
      <PracticePlayer exerciseSet={exerciseSet} wrongBookHref="/wrong-book" />
    </div>
  );
}
