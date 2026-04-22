import { getSpaceById } from "@/lib/queries/spaces";
import { seedNotices } from "@/lib/seed/seed";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";
import type { NoticeStatus } from "@/lib/constants/statuses";

const AUTO_ARCHIVABLE_NOTICE_STATUSES: NoticeStatus[] = ["draft", "published"];

interface ArchiveExpiredNoticesInput {
  spaceIds?: string[];
  noticeIds?: string[];
}

interface ExpiredNoticeSnapshot {
  id: string;
  spaceId: string;
  title: string;
  status: NoticeStatus;
}

export async function archiveExpiredNotices(input: ArchiveExpiredNoticesInput = {}) {
  if (input.spaceIds && input.spaceIds.length === 0) {
    return 0;
  }

  if (input.noticeIds && input.noticeIds.length === 0) {
    return 0;
  }

  const now = nowInShanghaiIso();
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });

  if (!supabase) {
    const archived: ExpiredNoticeSnapshot[] = [];

    for (const notice of seedNotices) {
      if (input.spaceIds?.length && !input.spaceIds.includes(notice.spaceId)) {
        continue;
      }

      if (input.noticeIds?.length && !input.noticeIds.includes(notice.id)) {
        continue;
      }

      if (
        notice.expireAt &&
        new Date(notice.expireAt).getTime() <= new Date(now).getTime() &&
        AUTO_ARCHIVABLE_NOTICE_STATUSES.includes(notice.status)
      ) {
        archived.push({
          id: notice.id,
          spaceId: notice.spaceId,
          title: notice.title,
          status: notice.status,
        });
        notice.status = "archived";
        notice.updatedAt = now;
      }
    }

    await notifyArchivedClassAnnouncements(archived);
    return archived.length;
  }

  let expiredQuery = supabase
    .from("notices")
    .select("id, space_id, title, status")
    .in("status", AUTO_ARCHIVABLE_NOTICE_STATUSES)
    .not("expire_at", "is", null)
    .lte("expire_at", now);

  if (input.spaceIds?.length) {
    expiredQuery = expiredQuery.in("space_id", input.spaceIds);
  }

  if (input.noticeIds?.length) {
    expiredQuery = expiredQuery.in("id", input.noticeIds);
  }

  const { data: expiredRows, error: expiredError } = await expiredQuery;

  if (expiredError) {
    throw new Error(expiredError.message);
  }

  if (!expiredRows?.length) {
    return 0;
  }

  const expiredSnapshots: ExpiredNoticeSnapshot[] = expiredRows.map((row) => ({
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    status: row.status,
  }));
  const expiredIds = expiredSnapshots.map((notice) => notice.id);

  const { data: archivedRows, error: archiveError } = await supabase
    .from("notices")
    .update({
      status: "archived",
      archived_at: now,
    })
    .in("id", expiredIds)
    .in("status", AUTO_ARCHIVABLE_NOTICE_STATUSES)
    .select("id");

  if (archiveError) {
    throw new Error(archiveError.message);
  }

  const archivedIds = new Set((archivedRows ?? []).map((row) => row.id));
  const archivedSnapshots = expiredSnapshots.filter((notice) => archivedIds.has(notice.id));

  await notifyArchivedClassAnnouncements(archivedSnapshots);
  return archivedSnapshots.length;
}

async function notifyArchivedClassAnnouncements(notices: ExpiredNoticeSnapshot[]) {
  const publishedNotices = notices.filter((notice) => notice.status === "published");

  await Promise.all(
    publishedNotices.map(async (notice) => {
      const space = await getSpaceById(notice.spaceId);

      if (!space || space.type !== "class") {
        return;
      }

      await notifyClassContentChanged({
        classId: notice.spaceId,
        contentType: "announcement",
        contentId: notice.id,
        actionType: "archived",
        title: notice.title,
        message: `Announcement "${notice.title}" has expired and was archived.`,
      });
    }),
  );
}
