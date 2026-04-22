import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CalendarRange } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { getClassSubjectLabelFromSlug } from "@/lib/constants/class-subjects";
import { getClassManagementPath } from "@/lib/constants/class-management";
import type { SpaceSummary } from "@/types/domain";

interface ClassManagementPageHeaderProps {
  classSpace: SpaceSummary;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBackToModules?: boolean;
}

export function ClassManagementPageHeader({
  classSpace,
  title,
  description,
  actions,
  showBackToModules = false,
}: ClassManagementPageHeaderProps) {
  return (
    <PageHeader
      actions={actions}
      breadcrumbs={
        showBackToModules ? (
          <Button asChild size="sm" variant="ghost">
            <Link href={getClassManagementPath(classSpace.id)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to modules
            </Link>
          </Button>
        ) : null
      }
      description={
        description ?? classSpace.description ?? "Manage class-level teaching content and student workflows."
      }
      title={
        <span className="space-y-3">
          <span className="block">{title ?? classSpace.title}</span>
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{getClassSubjectLabelFromSlug(classSpace.slug)}</Badge>
            {classSpace.academicYear ? (
              <span className="inline-flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <CalendarRange className="h-4 w-4" />
                {classSpace.academicYear}
              </span>
            ) : null}
          </span>
        </span>
      }
    />
  );
}
