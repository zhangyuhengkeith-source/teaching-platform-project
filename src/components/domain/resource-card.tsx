import Link from "next/link";
import { FileStack } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import { getResourceGroupLabel } from "@/lib/utils/resource-groups";
import type { ResourceSummary } from "@/types/domain";

interface ResourceCardProps {
  title: string;
  description?: string | null;
  resourceType: ResourceSummary["resourceType"];
  visibility?: ResourceSummary["visibility"];
  status?: ResourceSummary["status"];
  updatedAt?: string | null;
  href?: string;
}

export function ResourceCard({ title, description, resourceType, visibility, status, updatedAt, href }: ResourceCardProps) {
  const content = (
    <>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{getResourceGroupLabel(resourceType)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <FileStack className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{description ?? "Teaching resource ready for student access."}</p>
        <div className="flex flex-wrap items-center gap-2">
          {visibility ? <Badge variant="muted">{visibility}</Badge> : null}
          {status ? <StatusBadge status={status} /> : null}
        </div>
        {updatedAt ? <p className="text-xs text-slate-400">Updated {formatDate(updatedAt)}</p> : null}
      </CardContent>
    </>
  );

  return href ? (
    <Link href={href}>
      <Card className="h-full transition hover:border-blue-200 hover:shadow-md">{content}</Card>
    </Link>
  ) : (
    <Card className="h-full">{content}</Card>
  );
}

