import { canManageNotice } from "@/lib/permissions/notices";
import { listManageableClasses, listMembershipsForSpace } from "@/lib/queries/spaces";
import { mapNoticeRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seedNotices } from "@/lib/seed/seed";
import type { AppUserProfile } from "@/types/auth";
import type { NoticeSummary } from "@/types/domain";

export async function listNoticesForSpace(spaceId: string): Promise<NoticeSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedNotices.filter((notice) => notice.spaceId === spaceId);
  }

  const { data, error } = await supabase.from("notices").select("*").eq("space_id", spaceId).order("publish_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  return data.map(mapNoticeRow);
}

export async function getNoticeById(noticeId: string): Promise<NoticeSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedNotices.find((notice) => notice.id === noticeId) ?? null;
  }

  const { data, error } = await supabase.from("notices").select("*").eq("id", noticeId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapNoticeRow(data);
}

export async function listManageableNotices(profile: AppUserProfile): Promise<NoticeSummary[]> {
  const spaces = await listManageableClasses(profile);
  const notices = await Promise.all(spaces.map((space) => listNoticesForSpace(space.id)));

  return notices
    .flat()
    .filter((notice) => {
      const space = spaces.find((item) => item.id === notice.spaceId);
      return space ? canManageNotice(profile, { notice, space }) : false;
    })
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getManageableNoticeById(noticeId: string, profile: AppUserProfile): Promise<NoticeSummary | null> {
  const notice = await getNoticeById(noticeId);

  if (!notice) {
    return null;
  }

  const spaces = await listManageableClasses(profile);
  const space = spaces.find((item) => item.id === notice.spaceId);
  if (!space) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageNotice(profile, { notice, space, memberships })) {
    return null;
  }

  return notice;
}
