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
      <PageHeader description={space.description ?? "\u8fd9\u91cc\u4f1a\u96c6\u4e2d\u5c55\u793a\u5c0f\u7ec4\u534f\u4f5c\u3001\u9636\u6bb5\u4efb\u52a1\u3001\u516c\u544a\u63d0\u9192\u4e0e\u63d0\u4ea4\u53cd\u9988\u3002"} title={space.title} />
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard description="\u5f53\u524d\u8fd9\u95e8\u9009\u4fee\u8bfe\u4e2d\u5df2\u5f62\u6210\u7684\u5c0f\u7ec4\u6570\u91cf" title="\u5c0f\u7ec4">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{groups.length}</p>
            <Users className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="\u5df2\u53d1\u5e03\u7684\u9636\u6bb5\u4efb\u52a1\u4e0e\u63d0\u4ea4\u8981\u6c42" title="\u4efb\u52a1">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{publishedTasks.length}</p>
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description={space.academicYear ?? "\u5b66\u5e74\u5f85\u786e\u8ba4"} title="\u5f53\u524d\u5b66\u5e74">
          <div className="flex items-center justify-between">
            <p className="text-sm leading-6 text-slate-700">{space.groupingLocked ? "\u5206\u7ec4\u5df2\u9501\u5b9a" : "\u5206\u7ec4\u5f00\u653e\u4e2d"}</p>
            <BellRing className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard
            action={
              <Button asChild variant="outline">
                <Link href={`/electives/${space.slug}/group`}>{group ? "\u7ba1\u7406\u5c0f\u7ec4" : "\u9009\u62e9\u5c0f\u7ec4"}</Link>
              </Button>
            }
            description="\u4f60\u5728\u8fd9\u95e8\u9009\u4fee\u8bfe\u4e2d\u7684\u5f53\u524d\u5c0f\u7ec4\u72b6\u6001\u4e0e\u534f\u4f5c\u5165\u53e3\u3002"
            title="\u5c0f\u7ec4\u7a7a\u95f4"
          >
            {group ? (
              <GroupSummaryPanel actionHref={`/electives/${space.slug}/group`} group={group} />
            ) : (
              <EmptyState
                action={
                  <Button asChild>
                    <Link href={`/electives/${space.slug}/group`}>{"\u521b\u5efa\u6216\u52a0\u5165\u5c0f\u7ec4"}</Link>
                  </Button>
                }
                description="\u4f60\u5f53\u524d\u8fd8\u6ca1\u6709\u52a0\u5165\u5c0f\u7ec4\u3002\u8bf7\u5148\u9009\u62e9\u73b0\u6709\u5c0f\u7ec4\uff0c\u6216\u521b\u5efa\u65b0\u5c0f\u7ec4\uff0c\u518d\u53c2\u4e0e\u5c0f\u7ec4\u4efb\u52a1\u3002"
                icon={Users}
                title="\u6682\u65e0\u5c0f\u7ec4"
              />
            )}
          </SectionCard>

          <SectionCard description="\u8fd9\u95e8\u9009\u4fee\u8bfe\u5f53\u524d\u53ef\u8fdb\u884c\u7684\u4efb\u52a1\u4e0e\u63d0\u4ea4\u5185\u5bb9\u3002" title="\u4efb\u52a1">
            {publishedTasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {publishedTasks.map((task) => (
                  <TaskCard href={`/electives/${space.slug}/tasks/${task.slug}`} key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState description="\u6559\u5e08\u53d1\u5e03\u9009\u4fee\u8bfe\u4efb\u52a1\u540e\uff0c\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002" icon={FolderKanban} title="\u6682\u65e0\u4efb\u52a1" />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard description="\u6559\u5e08\u5bf9\u5f53\u524d\u9009\u4fee\u8bfe\u7684\u8bf4\u660e\u3001\u65b9\u5411\u4e0e\u9636\u6bb5\u5b89\u6392\u3002" title="\u8bfe\u7a0b\u6982\u89c8">
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>{space.description ?? "\u8fd9\u95e8\u9009\u4fee\u8bfe\u5df2\u7ecf\u53ef\u4ee5\u627f\u8f7d\u5c0f\u7ec4\u534f\u4f5c\u3001\u4efb\u52a1\u53d1\u5e03\u4e0e\u53cd\u9988\u6d41\u7a0b\u3002"}</p>
              <p>{"\u5b66\u5e74\uff1a"}{space.academicYear ?? "\u5f85\u786e\u8ba4"}</p>
            </div>
          </SectionCard>

          <SectionCard description="\u4e0e\u4f60\u5f53\u524d\u9009\u4fee\u8bfe\u76f8\u5173\u7684\u6700\u65b0\u516c\u544a\u4e0e\u63d0\u9192\u3002" title="\u6700\u65b0\u516c\u544a">
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
              <EmptyState description="\u5f53\u524d\u9009\u4fee\u8bfe\u6682\u65f6\u8fd8\u6ca1\u6709\u5df2\u53d1\u5e03\u516c\u544a\u3002" icon={BellRing} title="\u6682\u65e0\u516c\u544a" />
            )}
          </SectionCard>

          <SectionCard description="\u4e0e\u5f53\u524d\u9009\u4fee\u8bfe\u76f8\u5173\u7684\u8865\u5145\u6750\u6599\u4e0e\u53c2\u8003\u8d44\u6e90\u3002" title="\u5b66\u4e60\u6750\u6599">
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
              <EmptyState description="\u6559\u5e08\u6dfb\u52a0\u5171\u4eab\u8d44\u6e90\u540e\uff0c\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002" icon={FolderKanban} title="\u6682\u65e0\u6750\u6599" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
