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
import { isReadableContentStatus } from "@/lib/status/content-status";

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

  const visibleSections = space.sections.filter((section) => isReadableContentStatus(profile, section.status ?? "published"));
  const visibleResources = resources.filter((resource) => isReadableContentStatus(profile, resource.status) && (resource.status === "published" || profile.role !== "student"));
  const visibleNotices = notices.filter((notice) => isReadableContentStatus(profile, notice.status) && (notice.status === "published" || profile.role !== "student"));
  const visibleTasks = tasks.filter((task) => isReadableContentStatus(profile, task.status) && (task.status === "published" || profile.role !== "student"));

  const resourceCountBySection = new Map<string, number>();
  visibleResources.forEach((resource) => {
    if (resource.sectionId) {
      resourceCountBySection.set(resource.sectionId, (resourceCountBySection.get(resource.sectionId) ?? 0) + 1);
    }
  });

  const latestNotice = visibleNotices[0]?.title ?? "暂无已发布公告";

  return (
    <div className="space-y-6">
      <PageHeader description={space.description ?? "这里会集中展示班级资料、章节学习内容与最新公告。"} title={space.title} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard description="按章节、模块或周次组织的学习内容" title="章节总数">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{visibleSections.length}</p>
            <Layers3 className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="已发布或当前对你可见的学习资源" title="资源">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{visibleResources.length}</p>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="本班级中的作业任务与提交项目" title="任务">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{visibleTasks.length}</p>
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description={latestNotice} title="最新公告">
          <div className="flex items-center justify-between">
            <p className="text-sm leading-6 text-slate-700">{space.academicYear ?? "学年待确认"}</p>
            <BellRing className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard description="按章节、模块或周次进入班级学习内容。" title="章节">
            {visibleSections.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleSections.map((section) => (
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
              <EmptyState description="这个班级暂时还没有添加章节内容。" icon={Layers3} title="暂无章节" />
            )}
          </SectionCard>

          <SectionCard description="当前班级中最近可学习的资源材料。" title="最新资源">
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
              <EmptyState description="教师发布学习资源后，会显示在这里。" icon={BookOpen} title="暂无资源" />
            )}
          </SectionCard>

          <SectionCard description="与本班级关联的练习，用于自测与复习。" title="练习">
            {exerciseSets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {exerciseSets.map((exerciseSet) => (
                  <ExerciseSetCard
                    actionLabel="开始练习"
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
              <EmptyState description="教师发布练习后，会显示在这里。" icon={BookOpen} title="暂无练习" />
            )}
          </SectionCard>

          <SectionCard description="教师发布的班级任务与提交节点。" title="任务">
            {visibleTasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleTasks.map((task) => (
                  <TaskCard href={`/classes/${space.slug}/tasks/${task.slug}`} key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState description="教师发布任务后，会显示在这里。" icon={FolderKanban} title="暂无任务" />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard description="教师为本班级撰写的课程说明与学习概览。" title="班级概览">
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>{space.description ?? "这个班级已经可以承载章节内容、公告发布与学习资源。"}</p>
              <p>{"学年："}{space.academicYear ?? "待确认"}</p>
            </div>
          </SectionCard>

          <SectionCard description="与当前班级相关的最新公告与提醒。" title="近期公告">
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
              <EmptyState description="这个班级暂时还没有公告。" icon={BellRing} title="暂无公告" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
