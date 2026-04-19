import { GraduationCap } from "lucide-react";

import { requireClassViewer } from "@/lib/auth/require-class-access";
import { getClassSubjectLabelFromSlug } from "@/lib/constants/class-subjects";
import { listClassSpacesForUser, listSectionsForSpace } from "@/lib/queries/spaces";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { listNoticesForSpace } from "@/lib/queries/notices";
import { ClassCard } from "@/components/domain/class-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default async function ClassesPage() {
  const profile = await requireClassViewer();
  const classes = await listClassSpacesForUser(profile);

  const cards = await Promise.all(
    classes.map(async (space) => {
      const [sections, resources, notices] = await Promise.all([
        listSectionsForSpace(space.id),
        listResourcesForSpace(space.id),
        listNoticesForSpace(space.id),
      ]);

      return {
        ...space,
        sectionCount: sections.length,
        resourceCount: resources.length,
        noticeCount: notices.filter((notice) => notice.status === "published").length,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader description="Browse the class spaces you belong to and continue into structured teaching materials, sections, and notices." title="Classes" />
      {cards.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((space) => (
            <ClassCard
              academicYear={space.academicYear}
              description={space.description}
              href={`/classes/${space.slug}`}
              key={space.id}
              noticeCount={space.noticeCount}
              resourceCount={space.resourceCount}
              sectionCount={space.sectionCount}
              status={space.status}
              subjectLabel={getClassSubjectLabelFromSlug(space.slug)}
              title={space.title}
            />
          ))}
        </div>
      ) : (
        <EmptyState description="No class memberships are active yet. Once you are added to a class, it will appear here." icon={GraduationCap} title="No classes yet" />
      )}
    </div>
  );
}
