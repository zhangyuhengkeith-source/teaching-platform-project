import { BellRing, BookOpen, FolderKanban, Layers3 } from "lucide-react";

import { ExerciseSetCard } from "@/components/domain/exercise-set-card";
import { NoticeCard } from "@/components/domain/notice-card";
import { StudentClassCourseContent } from "@/components/domain/student-class-course-content";
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
import { listCourseChapterSetsByClassId } from "@/repositories/course-chapter-repository";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ spaceSlug: string }>;
}) {
  const { spaceSlug } = await params;
  const { profile, space } = await requireAccessibleClassBySlug(spaceSlug);
  const [resources, notices, exerciseSets, tasks, chapterSets] = await Promise.all([
    listResourcesForSpace(space.id),
    listNoticesForSpace(space.id),
    listExerciseSetsForSpace(space.id, profile),
    listTasksForClass(space.id, profile),
    listCourseChapterSetsByClassId(space.id),
  ]);

  const visibleChapterSets = chapterSets.filter(
    (chapterSet) => isReadableContentStatus(profile, chapterSet.status) && (chapterSet.status === "published" || profile.role !== "student"),
  );
  const visibleChapterItems = visibleChapterSets.flatMap((chapterSet) => chapterSet.items);
  const secondLevelChapterCount = visibleChapterItems.filter((item) => item.level === 2).length;
  const visibleResources = resources.filter(
    (resource) => isReadableContentStatus(profile, resource.status) && (resource.status === "published" || profile.role !== "student"),
  );
  const visibleNotices = notices.filter(
    (notice) => isReadableContentStatus(profile, notice.status) && (notice.status === "published" || profile.role !== "student"),
  );
  const visibleTasks = tasks.filter((task) => isReadableContentStatus(profile, task.status) && (task.status === "published" || profile.role !== "student"));

  const latestNotice = visibleNotices[0]?.title ?? "暂无已发布公告";

  return (
    <div className="space-y-6">
      <PageHeader description={space.description ?? "这里会集中展示班级资料、章节学习内容与最新公告。"} title={space.title} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard description="章节总数仅统计二级标题数量。" title="章节总数">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{secondLevelChapterCount}</p>
            <Layers3 className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="当前班级中已发布的学习资源。" title="资源">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{visibleResources.length}</p>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="本班级中的作业任务与提交项目。" title="任务">
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
          <StudentClassCourseContent chapterSets={visibleChapterSets} resources={visibleResources} />

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
                    sectionTitle={exerciseSet.chapterTitle ?? exerciseSet.sectionTitle}
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
              <p>学年：{space.academicYear ?? "待确认"}</p>
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
