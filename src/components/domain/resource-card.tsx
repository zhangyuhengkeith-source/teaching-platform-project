import Link from "next/link";
import { Download, FileStack } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatFileSize } from "@/lib/utils/format";
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

const RESOURCE_TYPE_LABELS: Record<ResourceSummary["resourceType"], string> = {
  ppt: "PPT \u8bfe\u4ef6",
  case_analysis: "\u6848\u4f8b\u5206\u6790",
  revision: "\u590d\u4e60\u8d44\u6599",
  extension: "\u62d3\u5c55\u8d44\u6599",
  worksheet: "\u7ec3\u4e60\u8bb2\u4e49",
  model_answer: "\u53c2\u8003\u7b54\u6848",
  mock_paper: "\u6a21\u62df\u8bd5\u5377",
  mark_scheme: "\u8bc4\u5206\u6807\u51c6",
  other: "\u5176\u4ed6\u8d44\u6e90",
};

const RESOURCE_VISIBILITY_LABELS: Record<ResourceSummary["visibility"], string> = {
  space: "\u7a7a\u95f4\u5185\u53ef\u89c1",
  selected_members: "\u6307\u5b9a\u6210\u5458\u53ef\u89c1",
  public: "\u516c\u5f00",
};

export function ResourceCard({ resourceId, title, description, resourceType, visibility, status, updatedAt, href, files }: ResourceCardProps) {
  const showFiles = !href && resourceId && files && files.length > 0;
  const content = (
    <>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{RESOURCE_TYPE_LABELS[resourceType]}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <FileStack className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{description ?? "\u9762\u5411\u5b66\u751f\u5f00\u653e\u7684\u6559\u5b66\u8d44\u6e90\u3002"}</p>
        <div className="flex flex-wrap items-center gap-2">
          {visibility ? <Badge variant="muted">{RESOURCE_VISIBILITY_LABELS[visibility]}</Badge> : null}
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
        {updatedAt ? <p className="text-xs text-slate-400">{"\u66f4\u65b0\u4e8e "}{formatDate(updatedAt)}</p> : null}
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
