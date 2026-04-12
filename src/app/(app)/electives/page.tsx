import { BookOpen } from "lucide-react";

import { ElectiveCard } from "@/components/domain/elective-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { listElectiveSpacesForUser, listGroupsForElective, listTasksForElective } from "@/lib/queries/electives";

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
      <PageHeader description="Elective spaces are organized around project groups, milestone tasks, and teacher feedback." title="Electives" />
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
        <EmptyState description="No elective memberships are active yet. Once you are added to an elective, it will appear here." icon={BookOpen} title="No electives yet" />
      )}
    </div>
  );
}
