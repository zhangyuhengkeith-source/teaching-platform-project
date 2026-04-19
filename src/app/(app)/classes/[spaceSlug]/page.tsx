import { BellRing, BookOpen, FolderKanban, Layers3 } from "lucide-react";

import { ChapterCard } from "@/components/domain/chapter-card";
import { ExerciseSetCard } from "@/components/domain/exercise-set-card";
import { NoticeCard } from "@/components/domain/notice-card";
import { ResourceCard } from "@/components/domain/resource-card";
import { TaskCard } from "@/components/domain/task-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAccessibleClassBySlug } from "@/lib/auth/require-class-access";
import { listExerciseSetsForSpace } from "@/lib/queries/exercises";
import { listNoticesForSpace } from "@/lib/queries/notices";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { listTasksForClass } from "@/lib/queries/tasks";
import { isTeacher } from "@/lib/permissions/profiles";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ spaceSlug: string }>;
}) {
  const { spaceSlug } = await params;
  const { profile, space } = await requireAccessibleClassBySlug(spaceSlug);
  const [resources, notices, exerciseSets, tasks] = await Promise.all([
    listResourcesForSpace(space.id),
    listNoticesForSpace(space.id),
    listExerciseSetsForSpace(space.id, profile),
    listTasksForClass(space.id, profile),
  ]);

  const visibleResources = isTeacher(profile) ? resources : resources.filter((resource) => resource.status === "published");
  const visibleNotices = isTeacher(profile) ? notices : notices.filter((notice) => notice.status === "published");
  const visibleTasks = isTeacher(profile) ? tasks : tasks.filter((task) => task.status === "published");

  const resourceCountBySection = new Map<string, number>();
  visibleResources.forEach((resource) => {
    if (resource.sectionId) {
      resourceCountBySection.set(resource.sectionId, (resourceCountBySection.get(resource.sectionId) ?? 0) + 1);
    }
  });

  const latestNotice = visibleNotices[0]?.title ?? "\u6682\u65e0\u5df2\u53d1\u5e03\u516c\u544a";

  return (
    <div className="space-y-6">
      <PageHeader description={space.description ?? "\u8fd9\u91cc\u4f1a\u96c6\u4e2d\u5c55\u793a\u73ed\u7ea7\u8d44\u6599\u3001\u7ae0\u8282\u5b66\u4e60\u5185\u5bb9\u4e0e\u6700\u65b0\u516c\u544a\u3002"} title={space.title} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard description="\u6309\u7ae0\u8282\u3001\u6a21\u5757\u6216\u5468\u6b21\u7ec4\u7ec7\u7684\u5b66\u4e60\u5185\u5bb9" title="\u7ae0\u8282\u603b\u6570">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{space.sections.length}</p>
            <Layers3 className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="\u5df2\u53d1\u5e03\u6216\u5f53\u524d\u5bf9\u4f60\u53ef\u89c1\u7684\u5b66\u4e60\u8d44\u6e90" title="\u8d44\u6e90">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{visibleResources.length}</p>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="\u672c\u73ed\u7ea7\u4e2d\u7684\u4f5c\u4e1a\u4efb\u52a1\u4e0e\u63d0\u4ea4\u9879\u76ee" title="\u4efb\u52a1">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{visibleTasks.length}</p>
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description={latestNotice} title="\u6700\u65b0\u516c\u544a">
          <div className="flex items-center justify-between">
            <p className="text-sm leading-6 text-slate-700">{space.academicYear ?? "\u5b66\u5e74\u5f85\u786e\u8ba4"}</p>
            <BellRing className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard description="\u6309\u7ae0\u8282\u3001\u6a21\u5757\u6216\u5468\u6b21\u8fdb\u5165\u73ed\u7ea7\u5b66\u4e60\u5185\u5bb9\u3002" title="\u7ae0\u8282">
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
              <EmptyState description="\u8fd9\u4e2a\u73ed\u7ea7\u6682\u65f6\u8fd8\u6ca1\u6709\u6dfb\u52a0\u7ae0\u8282\u5185\u5bb9\u3002" icon={Layers3} title="\u6682\u65e0\u7ae0\u8282" />
            )}
          </SectionCard>

          <SectionCard description="\u5f53\u524d\u73ed\u7ea7\u4e2d\u6700\u8fd1\u53ef\u5b66\u4e60\u7684\u8d44\u6e90\u6750\u6599\u3002" title="\u6700\u65b0\u8d44\u6e90">
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
              <EmptyState description="\u6559\u5e08\u53d1\u5e03\u5b66\u4e60\u8d44\u6e90\u540e\uff0c\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002" icon={BookOpen} title="\u6682\u65e0\u8d44\u6e90" />
            )}
          </SectionCard>

          <SectionCard description="\u4e0e\u672c\u73ed\u7ea7\u5173\u8054\u7684\u7ec3\u4e60\uff0c\u7528\u4e8e\u81ea\u6d4b\u4e0e\u590d\u4e60\u3002" title="\u7ec3\u4e60">
            {exerciseSets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {exerciseSets.map((exerciseSet) => (
                  <ExerciseSetCard
                    actionLabel="\u5f00\u59cb\u7ec3\u4e60"
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
              <EmptyState description="\u6559\u5e08\u53d1\u5e03\u7ec3\u4e60\u540e\uff0c\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002" icon={BookOpen} title="\u6682\u65e0\u7ec3\u4e60" />
            )}
          </SectionCard>

          <SectionCard description="\u6559\u5e08\u53d1\u5e03\u7684\u73ed\u7ea7\u4efb\u52a1\u4e0e\u63d0\u4ea4\u8282\u70b9\u3002" title="\u4efb\u52a1">
            {visibleTasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleTasks.map((task) => (
                  <TaskCard href={`/classes/${space.slug}/tasks/${task.slug}`} key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState description="\u6559\u5e08\u53d1\u5e03\u4efb\u52a1\u540e\uff0c\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002" icon={FolderKanban} title="\u6682\u65e0\u4efb\u52a1" />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard description="\u6559\u5e08\u4e3a\u672c\u73ed\u7ea7\u64b0\u5199\u7684\u8bfe\u7a0b\u8bf4\u660e\u4e0e\u5b66\u4e60\u6982\u89c8\u3002" title="\u73ed\u7ea7\u6982\u89c8">
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>{space.description ?? "\u8fd9\u4e2a\u73ed\u7ea7\u5df2\u7ecf\u53ef\u4ee5\u627f\u8f7d\u7ae0\u8282\u5185\u5bb9\u3001\u516c\u544a\u53d1\u5e03\u4e0e\u5b66\u4e60\u8d44\u6e90\u3002"}</p>
              <p>{"\u5b66\u5e74\uff1a"}{space.academicYear ?? "\u5f85\u786e\u8ba4"}</p>
            </div>
          </SectionCard>

          <SectionCard description="\u4e0e\u5f53\u524d\u73ed\u7ea7\u76f8\u5173\u7684\u6700\u65b0\u516c\u544a\u4e0e\u63d0\u9192\u3002" title="\u8fd1\u671f\u516c\u544a">
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
              <EmptyState description="\u8fd9\u4e2a\u73ed\u7ea7\u6682\u65f6\u8fd8\u6ca1\u6709\u516c\u544a\u3002" icon={BellRing} title="\u6682\u65e0\u516c\u544a" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
