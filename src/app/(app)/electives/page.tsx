import { BookOpen } from "lucide-react";

import { ElectiveCard } from "@/components/domain/elective-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { listElectiveSpacesForUser, listGroupsForElective } from "@/lib/queries/electives";
import { listTasksForElective } from "@/lib/queries/tasks";

export default async function ElectivesPage() {
  const profile = await requireElectiveViewer();
  const electives = await listElectiveSpacesForUser(profile);

  const cards = await Promise.all(
    electives.map(async (space) => {
      const [groups, tasks] = await Promise.all([listGroupsForElective(space.id, profile), listTasksForElective(space.id, profile)]);

      return {
        ...space,
        groupCount: groups.length,
        taskCount: tasks.length,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader description="选修课围绕项目小组、阶段任务与教师反馈来组织学习流程。" title="选修课" />
      {cards.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((space) => (
            <ElectiveCard
              academicYear={space.academicYear}
              description={space.description}
              groupCount={space.groupCount}
              href={`/electives/${space.slug}`}
              key={space.id}
              status={space.status}
              taskCount={space.taskCount}
              title={space.title}
            />
          ))}
        </div>
      ) : (
        <EmptyState description="你当前还没有已生效的选修课归属。加入选修课后，会在这里显示。" icon={BookOpen} title="暂无选修课" />
      )}
    </div>
  );
}
