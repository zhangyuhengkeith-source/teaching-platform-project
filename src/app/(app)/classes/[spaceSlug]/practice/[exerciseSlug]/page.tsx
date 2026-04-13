import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
import { PracticePlayer } from "@/components/domain/practice-player";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireClassViewer } from "@/lib/auth/require-class-access";
import { getExerciseSetWithItemsForUser } from "@/lib/queries/exercises";
import { getExerciseSetTypeLabelKey } from "@/lib/utils/exercise";

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
        description={exerciseSet.instructions ?? <TranslationText translationKey="practice.instructionsFallback" />}
        title={exerciseSet.title}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard description={<TranslationText translationKey="practice.practiceMode" />} title={<TranslationText translationKey="practice.type" />}>
          <p className="text-lg font-semibold"><TranslationText translationKey={getExerciseSetTypeLabelKey(exerciseSet.exerciseType)} /></p>
        </SectionCard>
        <SectionCard description={<TranslationText translationKey="practice.totalQuestionCount" />} title={<TranslationText translationKey="practice.items" />}>
          <p className="text-lg font-semibold">{exerciseSet.items.length}</p>
        </SectionCard>
        <SectionCard description={<TranslationText translationKey="practice.linkedSection" />} title={<TranslationText translationKey="practice.section" />}>
          <p className="text-lg font-semibold">{exerciseSet.section?.title ?? <TranslationText translationKey="practice.classWidePractice" />}</p>
        </SectionCard>
      </section>
      <PracticePlayer exerciseSet={exerciseSet} wrongBookHref="/wrong-book" />
    </div>
  );
}
