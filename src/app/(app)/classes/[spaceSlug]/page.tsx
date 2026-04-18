import { BellRing, BookOpen, Layers3 } from "lucide-react";

import { ChapterCard } from "@/components/domain/chapter-card";
import { ExerciseSetCard } from "@/components/domain/exercise-set-card";
import { NoticeCard } from "@/components/domain/notice-card";
import { ResourceCard } from "@/components/domain/resource-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAccessibleClassBySlug } from "@/lib/auth/require-class-access";
import { listExerciseSetsForSpace } from "@/lib/queries/exercises";
import { listNoticesForSpace } from "@/lib/queries/notices";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { isTeacher } from "@/lib/permissions/profiles";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ spaceSlug: string }>;
}) {
  const { spaceSlug } = await params;
  const { profile, space } = await requireAccessibleClassBySlug(spaceSlug);
  const [resources, notices, exerciseSets] = await Promise.all([
    listResourcesForSpace(space.id),
    listNoticesForSpace(space.id),
    listExerciseSetsForSpace(space.id, profile),
  ]);

  const visibleResources = isTeacher(profile) ? resources : resources.filter((resource) => resource.status === "published");
  const visibleNotices = isTeacher(profile) ? notices : notices.filter((notice) => notice.status === "published");

  const resourceCountBySection = new Map<string, number>();
  visibleResources.forEach((resource) => {
    if (resource.sectionId) {
      resourceCountBySection.set(resource.sectionId, (resourceCountBySection.get(resource.sectionId) ?? 0) + 1);
    }
  });

  const latestNotice = visibleNotices[0]?.title ?? "No published notices yet";

  return (
    <div className="space-y-6">
      <PageHeader description={space.description ?? "A calm home for class materials, section-based learning, and current notices."} title={space.title} />
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard description="Structured teaching chapters or weekly blocks" title="Total sections">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{space.sections.length}</p>
            <Layers3 className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="Published or teacher-visible learning materials" title="Resources">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{visibleResources.length}</p>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description={latestNotice} title="Latest notice">
          <div className="flex items-center justify-between">
            <p className="text-sm leading-6 text-slate-700">{space.academicYear ?? "Academic year to be confirmed"}</p>
            <BellRing className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard description="Move through the class by chapter, module, or week." title="Sections">
            {space.sections.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {space.sections.map((section) => (
                  <ChapterCard
                    description={section.description}
                    href={`/classes/${space.slug}/sections/${section.slug}`}
                    key={section.id}
                    resourceCount={resourceCountBySection.get(section.id) ?? 0}
                    title={section.title}
                    type={section.type}
                  />
                ))}
              </div>
            ) : (
              <EmptyState description="Sections have not been added to this class yet." icon={Layers3} title="No sections yet" />
            )}
          </SectionCard>

          <SectionCard description="Recent learning materials available in this class." title="Latest resources">
            {visibleResources.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleResources.slice(0, 4).map((resource) => (
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
            ) : (
              <EmptyState description="Learning resources will appear here once the teacher publishes them." icon={BookOpen} title="No resources yet" />
            )}
          </SectionCard>

          <SectionCard description="Linked practice sets for self-check and revision." title="Practice">
            {exerciseSets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {exerciseSets.map((exerciseSet) => (
                  <ExerciseSetCard
                    actionLabel="Start practice"
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
              <EmptyState description="Practice sets will appear here once the teacher publishes them." icon={BookOpen} title="No practice yet" />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard description="Teacher-authored overview for this class space." title="Class overview">
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>{space.description ?? "This class is ready for structured chapters, notices, and resource publishing."}</p>
              <p>Academic year: {space.academicYear ?? "To be confirmed"}</p>
            </div>
          </SectionCard>

          <SectionCard description="Current notices and reminders relevant to this class." title="Recent notices">
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
              <EmptyState description="There are no notices for this class yet." icon={BellRing} title="No notices yet" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
