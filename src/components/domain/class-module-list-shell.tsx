import type { ReactNode } from "react";
import { Archive, Filter, PlusCircle } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

interface ClassModuleListShellProps {
  classId: string;
  title: ReactNode;
  description: ReactNode;
  emptyTitle: ReactNode;
  emptyDescription: ReactNode;
  createLabel?: ReactNode;
  archivedLabel?: ReactNode;
}

export function ClassModuleListShell({
  classId,
  title,
  description,
  emptyTitle,
  emptyDescription,
  createLabel = "Create",
  archivedLabel = "Drafts and archived",
}: ClassModuleListShellProps) {
  return (
    <div className="space-y-4">
      <SectionCard description={description} title={title}>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-class-id={classId}>
            <div className="flex flex-wrap gap-2">
              <Button disabled type="button">
                <PlusCircle className="mr-2 h-4 w-4" />
                {createLabel}
              </Button>
              <Button disabled type="button" variant="outline">
                <Archive className="mr-2 h-4 w-4" />
                {archivedLabel}
              </Button>
            </div>
          </div>
          <FilterBar>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>
          </FilterBar>
          <EmptyState
            description={emptyDescription}
            icon={PlusCircle}
            title={emptyTitle}
          />
        </div>
      </SectionCard>
    </div>
  );
}
