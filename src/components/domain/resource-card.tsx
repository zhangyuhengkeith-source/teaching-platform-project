import Link from "next/link";
import { Download, FileStack } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatFileSize } from "@/lib/utils/format";
import { getResourceGroupLabel } from "@/lib/utils/resource-groups";
import type { ResourceSummary } from "@/types/domain";

interface ResourceCardProps {
  resourceId?: string;
  title: string;
  description?: string | null;
  resourceType: ResourceSummary["resourceType"];
  visibility?: ResourceSummary["visibility"];
  status?: ResourceSummary["status"];
  updatedAt?: string | null;
  href?: string;
  files?: ResourceSummary["files"];
}

export function ResourceCard({ resourceId, title, description, resourceType, visibility, status, updatedAt, href, files }: ResourceCardProps) {
  const showFiles = !href && resourceId && files && files.length > 0;
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
        {showFiles ? (
          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            {files.map((file) => (
              <a
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-white hover:text-primary"
                href={`/api/resources/${resourceId}/files/${file.id}`}
                key={file.id}
              >
                <span className="min-w-0 truncate">{file.fileName}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                  {formatFileSize(file.fileSize) ? <span>{formatFileSize(file.fileSize)}</span> : null}
                  <Download className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        ) : null}
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
