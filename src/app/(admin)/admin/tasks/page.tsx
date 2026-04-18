import { FolderKanban } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { TaskCard } from "@/components/domain/task-card";
import { TaskForm } from "@/components/domain/task-form";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SectionCard } from "@/components/shared/section-card";
import { requireRole } from "@/lib/auth/require-role";
import { listResourcesForSpace } from "@/lib/queries/resources";
import { listManageableClasses } from "@/lib/queries/spaces";
import { listManageableTasksForSpace } from "@/lib/queries/tasks";

export default async function AdminTasksPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const classes = await listManageableClasses(profile);
  const [taskGroups, resourceGroups] = await Promise.all([
    Promise.all(classes.map((space) => listManageableTasksForSpace(space.id, profile))),
    Promise.all(classes.map((space) => listResourcesForSpace(space.id))),
  ]);

  const tasks = taskGroups
    .flat()
    .sort((left, right) => (right.updatedAt ?? right.createdAt ?? "").localeCompare(left.updatedAt ?? left.createdAt ?? ""));
  const resources = resourceGroups.flat();

  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="admin.tasks.description" />}
        title={<TranslationText translationKey="admin.tasks.title" />}
      />
      <FilterBar>
        <SearchInput placeholderKey="admin.tasks.searchPlaceholder" />
      </FilterBar>

      <SectionCard description={<TranslationText translationKey="admin.tasks.createDescription" />} title={<TranslationText translationKey="admin.tasks.createTitle" />}>
        {classes.length > 0 ? (
          <TaskForm mode="create" resources={resources} spaceId={classes[0]!.id} spaces={classes} spaceType="class" />
        ) : (
          <EmptyState
            description={<TranslationText translationKey="admin.tasks.noClassesDescription" />}
            icon={FolderKanban}
            title={<TranslationText translationKey="admin.tasks.noClassesTitle" />}
          />
        )}
      </SectionCard>

      <SectionCard description={<TranslationText translationKey="admin.tasks.manageDescription" />} title={<TranslationText translationKey="admin.tasks.manageTitle" />}>
        {tasks.length > 0 ? (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div className="space-y-4 rounded-2xl border border-border bg-slate-50/60 p-5" key={task.id}>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    <TranslationText translationKey="admin.tables.class" />
                  </p>
                  <p className="text-sm font-medium text-slate-900">{task.spaceTitle ?? task.spaceId}</p>
                </div>
                <TaskCard task={task} />
                <TaskForm initialValues={{ ...task, id: task.id }} mode="edit" resources={resources} spaceId={task.spaceId} spaceType="class" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description={<TranslationText translationKey="admin.tasks.emptyDescription" />} icon={FolderKanban} title={<TranslationText translationKey="admin.tasks.emptyTitle" />} />
        )}
      </SectionCard>
    </div>
  );
}
