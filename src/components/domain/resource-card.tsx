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
  ppt: "PPT 课件",
  case_analysis: "案例分析",
  revision: "复习资料",
  extension: "拓展资料",
  worksheet: "练习讲义",
  model_answer: "参考答案",
  mock_paper: "模拟试卷",
  mark_scheme: "评分标准",
  other: "其他资源",
};

const RESOURCE_VISIBILITY_LABELS: Record<ResourceSummary["visibility"], string> = {
  space: "空间内可见",
  selected_members: "指定成员可见",
  public: "公开",
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
        <p className="text-sm leading-6 text-muted-foreground">{description ?? "面向学生开放的教学资源。"}</p>
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
        {updatedAt ? <p className="text-xs text-slate-400">{"更新于 "}{formatDate(updatedAt)}</p> : null}
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
