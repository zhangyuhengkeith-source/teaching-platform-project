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
      <PageHeader description={space.description ?? "An elective course space for collaborative project work, deadlines, and submissions."} title={space.title} />
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard description="Students currently grouped in this elective" title="Groups">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{groups.length}</p>
            <Users className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description="Published milestone and submission tasks" title="Tasks">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{publishedTasks.length}</p>
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
        <SectionCard description={space.academicYear ?? "Academic year to be confirmed"} title="Current cycle">
          <div className="flex items-center justify-between">
            <p className="text-sm leading-6 text-slate-700">{space.groupingLocked ? "Grouping is locked" : "Grouping is open"}</p>
            <BellRing className="h-5 w-5 text-primary" />
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard
            action={
              <Button asChild variant="outline">
                <Link href={`/electives/${space.slug}/group`}>{group ? "Manage group" : "Choose group"}</Link>
              </Button>
            }
            description="Your current project group context in this elective."
            title="Group workspace"
          >
            {group ? (
              <GroupSummaryPanel actionHref={`/electives/${space.slug}/group`} group={group} />
            ) : (
              <EmptyState
                action={
                  <Button asChild>
                    <Link href={`/electives/${space.slug}/group`}>Create or join group</Link>
                  </Button>
                }
                description="You are not in a group yet. Choose a group or create a new one before group tasks open."
                icon={Users}
                title="No group yet"
              />
            )}
          </SectionCard>

          <SectionCard description="Upcoming tasks and submissions for this elective." title="Tasks">
            {publishedTasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {publishedTasks.map((task) => (
                  <TaskCard href={`/electives/${space.slug}/tasks/${task.slug}`} key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState description="Published elective tasks will appear here once the teacher releases them." icon={FolderKanban} title="No tasks yet" />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard description="Teacher guidance and current elective framing." title="Course overview">
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>{space.description ?? "This elective is ready for group work, task releases, and feedback cycles."}</p>
              <p>Academic year: {space.academicYear ?? "To be confirmed"}</p>
            </div>
          </SectionCard>

          <SectionCard description="Recent notices relevant to this elective." title="Latest notices">
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
              <EmptyState description="No elective notices have been published yet." icon={BellRing} title="No notices yet" />
            )}
          </SectionCard>

          <SectionCard description="Supporting materials linked to this elective space." title="Materials">
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
              <EmptyState description="Shared resources will appear here once the teacher adds them." icon={FolderKanban} title="No materials yet" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
