import { ArrowRightCircle, BellRing, FileStack } from "lucide-react";

import { ExerciseSetCard } from "@/components/domain/exercise-set-card";
import { NoticeCard } from "@/components/domain/notice-card";
import { ResourceCard } from "@/components/domain/resource-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAccessibleSection } from "@/lib/auth/require-class-access";
import { listExerciseSetsForSection } from "@/lib/queries/exercises";
import { listNoticesForSpace } from "@/lib/queries/notices";
import { listResourcesForSection } from "@/lib/queries/resources";
import { isTeacher } from "@/lib/permissions/profiles";
import { groupResourcesByType } from "@/lib/utils/resource-groups";

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ spaceSlug: string; sectionSlug: string }>;
}) {
  const { spaceSlug, sectionSlug } = await params;
  const { profile, space, section } = await requireAccessibleSection(spaceSlug, sectionSlug);
  const [resources, notices, exerciseSets] = await Promise.all([
    listResourcesForSection(section.id),
    listNoticesForSpace(space.id),
    listExerciseSetsForSection(section.id, profile),
  ]);

  const visibleResources = isTeacher(profile) ? resources : resources.filter((resource) => resource.status === "published");
  const visibleNotices = isTeacher(profile) ? notices : notices.filter((notice) => notice.status === "published");
  const groupedResources = groupResourcesByType(visibleResources);

  return (
    <div className="space-y-6">
      <PageHeader description={section.description ?? "Section-focused study materials and current notices."} title={section.title} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard description="A simple study prompt to help students move through the material with intention." title="Recommended next step">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <ArrowRightCircle className="mt-0.5 h-5 w-5 text-primary" />
              <p className="text-sm leading-6 text-slate-700">
                Start with the core slides or worksheet in this section, then review the latest class notice before moving on to written practice.
              </p>
            </div>
          </SectionCard>

          <SectionCard description="Resources are grouped in a student-friendly way to keep the section readable." title="Section resources">
            {groupedResources.length > 0 ? (
              <div className="space-y-6">
                {groupedResources.map((group) => (
                  <div className="space-y-4" key={group.label}>
                    <h2 className="text-lg font-semibold">{group.label}</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {group.items.map((resource) => (
                        <ResourceCard
                          description={resource.description}
                          files={resource.files}
                          key={resource.id}
                          resourceId={resource.id}
                          resourceType={resource.resourceType}
                          status={resource.status}
                          title={resource.title}
                          updatedAt={resource.updatedAt}
                          visibility={resource.visibility}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState description="This section does not have published resources yet." icon={FileStack} title="No resources yet" />
            )}
          </SectionCard>

          <SectionCard description="Short practice sets linked directly to this section." title="Practice">
            {exerciseSets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {exerciseSets.map((exerciseSet) => (
                  <ExerciseSetCard
                    actionLabel="Open practice"
                    exerciseType={exerciseSet.exerciseType}
                    href={`/classes/${space.slug}/practice/${exerciseSet.slug}`}
                    instructions={exerciseSet.instructions}
                    itemCount={exerciseSet.itemCount}
                    key={exerciseSet.id}
                    sectionTitle={exerciseSet.sectionTitle}
                    status={exerciseSet.status}
                    title={exerciseSet.title}
                  />
                ))}
              </div>
            ) : (
              <EmptyState description="No practice sets are linked to this section yet." icon={ArrowRightCircle} title="No section practice yet" />
            )}
          </SectionCard>
        </div>

        <SectionCard description="Class-wide notices remain visible from within the section so students do not miss deadlines." title="Current class notices">
          {visibleNotices.length > 0 ? (
            <div className="space-y-4">
              {visibleNotices.slice(0, 3).map((notice) => (
                <NoticeCard
                  bodyPreview={notice.body}
                  key={notice.id}
                  noticeType={notice.noticeType}
                  pinned={notice.isPinned}
                  publishAt={notice.publishAt}
                  status={notice.status}
                  title={notice.title}
                />
              ))}
            </div>
          ) : (
            <EmptyState description="No notices have been published for this class yet." icon={BellRing} title="No notices yet" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
