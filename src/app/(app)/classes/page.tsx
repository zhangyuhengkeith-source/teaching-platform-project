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
      <PageHeader description="\u67e5\u770b\u4f60\u5df2\u52a0\u5165\u7684\u73ed\u7ea7\uff0c\u5e76\u7ee7\u7eed\u8fdb\u5165\u8bfe\u7a0b\u7ae0\u8282\u3001\u5b66\u4e60\u8d44\u6e90\u4e0e\u73ed\u7ea7\u516c\u544a\u3002" title="\u73ed\u7ea7" />
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
        <EmptyState description="\u4f60\u5f53\u524d\u8fd8\u6ca1\u6709\u5df2\u751f\u6548\u7684\u73ed\u7ea7\u5f52\u5c5e\u3002\u52a0\u5165\u73ed\u7ea7\u540e\uff0c\u4f1a\u5728\u8fd9\u91cc\u663e\u793a\u3002" icon={GraduationCap} title="\u6682\u65e0\u73ed\u7ea7" />
      )}
    </div>
  );
}
