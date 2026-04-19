"use client";

import { Download, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime, formatFileSize } from "@/lib/utils/format";
import type { SubmissionFileSummary } from "@/types/domain";

export function SubmissionFileList({
  submissionId,
  files,
  emptyText = "\u6682\u65e0\u9644\u4ef6\u3002",
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
              {formatFileSize(file.fileSize) ?? "\u5927\u5c0f\u672a\u77e5"}
              {showCreatedAt ? ` \u00b7 \u6dfb\u52a0\u4e8e ${formatDateTime(file.createdAt)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {submissionId ? (
              <a
                className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                href={`/api/submissions/${submissionId}/files/${file.id}`}
              >
                <Download className="h-3.5 w-3.5" />
                {"\u4e0b\u8f7d"}
              </a>
            ) : null}
            {onRemove ? (
              <Button onClick={() => onRemove(file.id)} size="sm" type="button" variant="ghost">
                {"\u79fb\u9664"}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
