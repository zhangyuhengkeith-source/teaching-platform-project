import { ArrowRightCircle, BellRing, FileStack } from "lucide-react";

import { ExerciseSetCard } from "@/components/domain/exercise-set-card";
import { NoticeCard } from "@/components/domain/notice-card";
import { ResourceCard } from "@/components/domain/resource-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAccessibleSection } from "@/lib/auth/require-class-access";
import { listExerciseSetsForSection } from "@/lib/queries/exercises";
import { listNoticesForSpace } from "@/lib/queries/notices";
import { listResourcesForSection } from "@/lib/queries/resources";
import { isTeacher } from "@/lib/permissions/profiles";
import { groupResourcesByType } from "@/lib/utils/resource-groups";

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ spaceSlug: string; sectionSlug: string }>;
}) {
  const { spaceSlug, sectionSlug } = await params;
  const { profile, space, section } = await requireAccessibleSection(spaceSlug, sectionSlug);
  const [resources, notices, exerciseSets] = await Promise.all([
    listResourcesForSection(section.id),
    listNoticesForSpace(space.id),
    listExerciseSetsForSection(section.id, profile),
  ]);

  const visibleResources = isTeacher(profile) ? resources : resources.filter((resource) => resource.status === "published");
  const visibleNotices = isTeacher(profile) ? notices : notices.filter((notice) => notice.status === "published");
  const groupedResources = groupResourcesByType(visibleResources);

  return (
    <div className="space-y-6">
      <PageHeader description={section.description ?? "\u8fd9\u91cc\u4f1a\u5c55\u793a\u8be5\u7ae0\u8282\u5bf9\u5e94\u7684\u5b66\u4e60\u8d44\u6e90\u3001\u7ec3\u4e60\u4e0e\u73ed\u7ea7\u516c\u544a\u3002"} title={section.title} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard description="\u5e2e\u52a9\u4f60\u66f4\u987a\u7545\u63a8\u8fdb\u672c\u7ae0\u8282\u5b66\u4e60\u7684\u5efa\u8bae\u6b65\u9aa4\u3002" title="\u5efa\u8bae\u5b66\u4e60\u8def\u5f84">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <ArrowRightCircle className="mt-0.5 h-5 w-5 text-primary" />
              <p className="text-sm leading-6 text-slate-700">
                {"\u5efa\u8bae\u5148\u5b8c\u6210\u672c\u7ae0\u8282\u7684\u6838\u5fc3\u8bfe\u4ef6\u6216\u8bb2\u4e49\uff0c\u518d\u67e5\u770b\u6700\u65b0\u73ed\u7ea7\u516c\u544a\uff0c\u6700\u540e\u8fdb\u5165\u4e66\u9762\u7ec3\u4e60\u6216\u81ea\u6d4b\u4efb\u52a1\u3002"}
              </p>
            </div>
          </SectionCard>

          <SectionCard description="\u8d44\u6e90\u4f1a\u6309\u7c7b\u578b\u5206\u7ec4\u5c55\u793a\uff0c\u65b9\u4fbf\u5feb\u901f\u67e5\u627e\u3002" title="\u7ae0\u8282\u8d44\u6e90">
            {groupedResources.length > 0 ? (
              <div className="space-y-6">
                {groupedResources.map((group) => (
                  <div className="space-y-4" key={group.label}>
                    <h2 className="text-lg font-semibold">{group.label}</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {group.items.map((resource) => (
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
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState description="\u8fd9\u4e2a\u7ae0\u8282\u6682\u65f6\u8fd8\u6ca1\u6709\u5df2\u53d1\u5e03\u8d44\u6e90\u3002" icon={FileStack} title="\u6682\u65e0\u8d44\u6e90" />
            )}
          </SectionCard>

          <SectionCard description="\u4e0e\u672c\u7ae0\u8282\u76f4\u63a5\u5173\u8054\u7684\u77ed\u7ec3\u4e60\u4e0e\u81ea\u6d4b\u5185\u5bb9\u3002" title="\u7ec3\u4e60">
            {exerciseSets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {exerciseSets.map((exerciseSet) => (
                  <ExerciseSetCard
                    actionLabel="\u8fdb\u5165\u7ec3\u4e60"
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
              <EmptyState description="\u8fd9\u4e2a\u7ae0\u8282\u6682\u65f6\u8fd8\u6ca1\u6709\u5173\u8054\u7ec3\u4e60\u3002" icon={ArrowRightCircle} title="\u6682\u65e0\u7ae0\u8282\u7ec3\u4e60" />
            )}
          </SectionCard>
        </div>

        <SectionCard description="\u7ae0\u8282\u5185\u4ecd\u4f1a\u5c55\u793a\u73ed\u7ea7\u516c\u544a\uff0c\u907f\u514d\u9519\u8fc7\u91cd\u8981\u63d0\u9192\u4e0e\u622a\u6b62\u65f6\u95f4\u3002" title="\u5f53\u524d\u73ed\u7ea7\u516c\u544a">
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
            <EmptyState description="\u5f53\u524d\u73ed\u7ea7\u6682\u65f6\u8fd8\u6ca1\u6709\u5df2\u53d1\u5e03\u516c\u544a\u3002" icon={BellRing} title="\u6682\u65e0\u516c\u544a" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
