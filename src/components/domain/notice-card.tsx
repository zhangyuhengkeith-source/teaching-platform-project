import { BellDot, Pin } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, truncateText } from "@/lib/utils/format";
import type { NoticeSummary } from "@/types/domain";

interface NoticeCardProps {
  title: string;
  bodyPreview: string;
  noticeType: NoticeSummary["noticeType"];
  publishAt?: string | null;
  pinned?: boolean;
  status?: NoticeSummary["status"];
}

const NOTICE_TYPE_LABELS: Record<NoticeSummary["noticeType"], string> = {
  homework: "作业",
  deadline: "截止提醒",
  mock_exam: "模考",
  general: "通用通知",
  grouping: "分组",
  service_update: "服务更新",
};

export function NoticeCard({ title, bodyPreview, noticeType, publishAt, pinned, status }: NoticeCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-primary">
              <BellDot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="muted">{NOTICE_TYPE_LABELS[noticeType]}</Badge>
                {status ? <StatusBadge status={status} /> : null}
                {pinned ? (
                  <Badge variant="primary">
                    <Pin className="mr-1 h-3 w-3" />
                    置顶
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">{truncateText(bodyPreview, 180)}</p>
        {publishAt ? <p className="text-xs text-slate-400">发布于 {formatDate(publishAt)}</p> : null}
      </CardContent>
    </Card>
  );
}
