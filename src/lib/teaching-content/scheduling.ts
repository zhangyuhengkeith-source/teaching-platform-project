import type { ContentStatus } from "@/lib/constants/statuses";
import { isAfterShanghaiNow, nowInShanghaiIso } from "@/lib/utils/timezone";

export function resolveScheduledStatus(publishAt: string | null | undefined, requestedStatus?: ContentStatus | null): ContentStatus {
  if (requestedStatus === "archived" || requestedStatus === "deleted") {
    return requestedStatus;
  }

  if (publishAt && isAfterShanghaiNow(publishAt)) {
    return "draft";
  }

  return requestedStatus ?? "published";
}

export function getPublishNowPatch() {
  const timestamp = nowInShanghaiIso();

  return {
    publish_at: timestamp,
    status: "published" as const,
  };
}
