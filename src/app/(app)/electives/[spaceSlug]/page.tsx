import Link from "next/link";
import { BellRing, FolderKanban, Users } from "lucide-react";

import { GroupSummaryPanel } from "@/components/domain/group-summary-panel";
import { NoticeCard } from "@/components/domain/notice-card";
import { ResourceCard } from "@/components/domain/resource-card";
import { TaskCard } from "@/components/domain/task-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { requireAccessibleElectiveBySlug } from "@/lib/auth/require-elective-access";
import { listGroupsForElective, getGroupForUserInElective } from "@/lib/queries/electives";
import { listNoticesForSpace } from "@/lib/queries/notices";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { listTasksForElective } from "@/lib/queries/tasks";

export default async function ElectiveDetailPage({
  params,
}: {
  params: Promise<{ spaceSlug: string }>;
}) {
  const { spaceSlug } = await params;
  const { profile, space } = await requireAccessibleElectiveBySlug(spaceSlug);
  const [group, groups, tasks, notices, resources] = await Promise.all([
    getGroupForUserInElective(space.id, profile.id),
    listGroupsForElective(space.id, profile),
    listTasksForElective(space.id, profile),
    listNoticesForSpace(space.id),
    listResourcesForSpace(space.id),
  ]);

  const publishedNotices = notices.filter((notice) => notice.status === "published").slice(0, 3);
  const visibleResources = resources.filter((resource) => resource.status === "published").slice(0, 3);
  const publishedTasks = tasks.filter((task) => task.status === "published");

  return (
    <div className="space-y-6">
      <PageHeader description={space.description ?? "这里会集中展示小组协作、阶段任务、公告提醒与提交反馈。"} title={space.title} />
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard description="当前这门选修课中已形成的小组数量" title="小组">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{groups.length}</p>
            <Users className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="已发布的阶段任务与提交要求" title="任务">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{publishedTasks.length}</p>
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description={space.academicYear ?? "学年待确认"} title="当前学年">
          <div className="flex items-center justify-between">
            <p className="text-sm leading-6 text-slate-700">{space.groupingLocked ? "分组已锁定" : "分组开放中"}</p>
            <BellRing className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard
            action={
              <Button asChild variant="outline">
                <Link href={`/electives/${space.slug}/group`}>{group ? "管理小组" : "选择小组"}</Link>
              </Button>
            }
            description="你在这门选修课中的当前小组状态与协作入口。"
            title="小组空间"
          >
            {group ? (
              <GroupSummaryPanel actionHref={`/electives/${space.slug}/group`} group={group} />
            ) : (
              <EmptyState
                action={
                  <Button asChild>
                    <Link href={`/electives/${space.slug}/group`}>{"创建或加入小组"}</Link>
                  </Button>
                }
                description="你当前还没有加入小组。请先选择现有小组，或创建新小组，再参与小组任务。"
                icon={Users}
                title="暂无小组"
              />
            )}
          </SectionCard>

          <SectionCard description="这门选修课当前可进行的任务与提交内容。" title="任务">
            {publishedTasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {publishedTasks.map((task) => (
                  <TaskCard href={`/electives/${space.slug}/tasks/${task.slug}`} key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState description="教师发布选修课任务后，会显示在这里。" icon={FolderKanban} title="暂无任务" />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard description="教师对当前选修课的说明、方向与阶段安排。" title="课程概览">
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>{space.description ?? "这门选修课已经可以承载小组协作、任务发布与反馈流程。"}</p>
              <p>{"学年："}{space.academicYear ?? "待确认"}</p>
            </div>
          </SectionCard>

          <SectionCard description="与你当前选修课相关的最新公告与提醒。" title="最新公告">
            {publishedNotices.length > 0 ? (
              <div className="space-y-4">
                {publishedNotices.map((notice) => (
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
              <EmptyState description="当前选修课暂时还没有已发布公告。" icon={BellRing} title="暂无公告" />
            )}
          </SectionCard>

          <SectionCard description="与当前选修课相关的补充材料与参考资源。" title="学习材料">
            {visibleResources.length > 0 ? (
              <div className="space-y-4">
                {visibleResources.map((resource) => (
                  <ResourceCard
                    description={resource.description}
                    key={resource.id}
                    resourceType={resource.resourceType}
                    status={resource.status}
                    title={resource.title}
                    updatedAt={resource.updatedAt}
                    visibility={resource.visibility}
                  />
                ))}
              </div>
            ) : (
              <EmptyState description="教师添加共享资源后，会显示在这里。" icon={FolderKanban} title="暂无材料" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
