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
      <PageHeader description="\u9009\u4fee\u8bfe\u56f4\u7ed5\u9879\u76ee\u5c0f\u7ec4\u3001\u9636\u6bb5\u4efb\u52a1\u4e0e\u6559\u5e08\u53cd\u9988\u6765\u7ec4\u7ec7\u5b66\u4e60\u6d41\u7a0b\u3002" title="\u9009\u4fee\u8bfe" />
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
        <EmptyState description="\u4f60\u5f53\u524d\u8fd8\u6ca1\u6709\u5df2\u751f\u6548\u7684\u9009\u4fee\u8bfe\u5f52\u5c5e\u3002\u52a0\u5165\u9009\u4fee\u8bfe\u540e\uff0c\u4f1a\u5728\u8fd9\u91cc\u663e\u793a\u3002" icon={BookOpen} title="\u6682\u65e0\u9009\u4fee\u8bfe" />
      )}
    </div>
  );
}
