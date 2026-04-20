"use client";

import { Download, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime, formatFileSize } from "@/lib/utils/format";
import type { SubmissionFileSummary } from "@/types/domain";

export function SubmissionFileList({
  submissionId,
  files,
  emptyText = "暂无附件。",
  onRemove,
  showCreatedAt = false,
}: {
  submissionId?: string | null;
  files: SubmissionFileSummary[];
  emptyText?: string;
  onRemove?: (fileId: string) => void;
  showCreatedAt?: boolean;
}) {
  if (files.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">{emptyText}</div>;
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-white p-3">
      {files.map((file) => (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0" key={file.id}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
              <p className="truncate text-sm font-medium text-slate-900">{file.fileName}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFileSize(file.fileSize) ?? "大小未知"}
              {showCreatedAt ? ` · 添加于 ${formatDateTime(file.createdAt)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {submissionId ? (
              <a
                className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                href={`/api/submissions/${submissionId}/files/${file.id}`}
              >
                <Download className="h-3.5 w-3.5" />
                {"下载"}
              </a>
            ) : null}
            {onRemove ? (
              <Button onClick={() => onRemove(file.id)} size="sm" type="button" variant="ghost">
                {"移除"}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
