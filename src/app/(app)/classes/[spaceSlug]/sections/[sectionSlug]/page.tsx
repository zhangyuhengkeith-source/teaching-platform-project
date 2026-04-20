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
      <PageHeader description={section.description ?? "这里会展示该章节对应的学习资源、练习与班级公告。"} title={section.title} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard description="帮助你更顺畅推进本章节学习的建议步骤。" title="建议学习路径">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <ArrowRightCircle className="mt-0.5 h-5 w-5 text-primary" />
              <p className="text-sm leading-6 text-slate-700">
                {"建议先完成本章节的核心课件或讲义，再查看最新班级公告，最后进入书面练习或自测任务。"}
              </p>
            </div>
          </SectionCard>

          <SectionCard description="资源会按类型分组展示，方便快速查找。" title="章节资源">
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
              <EmptyState description="这个章节暂时还没有已发布资源。" icon={FileStack} title="暂无资源" />
            )}
          </SectionCard>

          <SectionCard description="与本章节直接关联的短练习与自测内容。" title="练习">
            {exerciseSets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {exerciseSets.map((exerciseSet) => (
                  <ExerciseSetCard
                    actionLabel="进入练习"
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
              <EmptyState description="这个章节暂时还没有关联练习。" icon={ArrowRightCircle} title="暂无章节练习" />
            )}
          </SectionCard>
        </div>

        <SectionCard description="章节内仍会展示班级公告，避免错过重要提醒与截止时间。" title="当前班级公告">
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
            <EmptyState description="当前班级暂时还没有已发布公告。" icon={BellRing} title="暂无公告" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
