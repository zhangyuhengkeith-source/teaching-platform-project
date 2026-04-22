import { ClassManagementPageHeader } from "@/components/domain/class-management-page-header";
import { ClassModuleListShell } from "@/components/domain/class-module-list-shell";
import type { SpaceSummary } from "@/types/domain";

interface ClassModulePageShellProps {
  classSpace: SpaceSummary;
  moduleTitle: string;
  moduleDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  createLabel: string;
}

export function ClassModulePageShell({
  classSpace,
  moduleTitle,
  moduleDescription,
  emptyTitle,
  emptyDescription,
  createLabel,
}: ClassModulePageShellProps) {
  return (
    <div className="space-y-6">
      <ClassManagementPageHeader
        classSpace={classSpace}
        description={moduleDescription}
        showBackToModules
        title={moduleTitle}
      />
      <ClassModuleListShell
        classId={classSpace.id}
        createLabel={createLabel}
        description={moduleDescription}
        emptyDescription={emptyDescription}
        emptyTitle={emptyTitle}
        title={moduleTitle}
      />
    </div>
  );
}
