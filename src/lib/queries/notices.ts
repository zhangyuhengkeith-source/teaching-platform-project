import { canManageNotice } from "@/lib/permissions/notices";
import { listManageableClasses, listMembershipsForSpace } from "@/lib/queries/spaces";
import { listManageableElectiveSpaces } from "@/lib/queries/electives";
import { mapNoticeRow } from "@/lib/db/mappers";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seedNotices } from "@/lib/seed/seed";
import { isAdminRole } from "@/lib/permissions/profiles";
import { isNonArchivedContentStatus } from "@/lib/status/content-status";
import type { AppUserProfile } from "@/types/auth";
import type { NoticeSummary, SpaceSummary } from "@/types/domain";

export async function listManageableNoticeSpaces(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const [classes, electives] = await Promise.all([listManageableClasses(profile), listManageableElectiveSpaces(profile)]);
  return [...classes, ...electives];
}

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
  const spaces = await listManageableNoticeSpaces(profile);
  const spacesWithMemberships = await Promise.all(
    spaces.map(async (space) => ({
      space,
      memberships: await listMembershipsForSpace(space.id),
    })),
  );
  const supabase = await createSupabaseServerWriteClient();
  const spaceIds = spaces.map((space) => space.id);
  const notices =
    supabase && spaceIds.length > 0
      ? (() => supabase.from("notices").select("*").in("space_id", spaceIds).order("updated_at", { ascending: false }))()
      : null;

  const noticeItems =
    notices
      ? await notices.then(({ data, error }) => {
          if (error || !data) {
            return [] as NoticeSummary[];
          }

          return data.map(mapNoticeRow);
        })
      : (await Promise.all(spaces.map((space) => listNoticesForSpace(space.id)))).flat();

  return noticeItems
    .filter((notice) => {
      if (!isAdminRole(profile) && !isNonArchivedContentStatus(notice.status)) {
        return false;
      }

      const match = spacesWithMemberships.find(({ space }) => space.id === notice.spaceId);
      return match ? canManageNotice(profile, { notice, space: match.space, memberships: match.memberships }) : false;
    })
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getManageableNoticeById(noticeId: string, profile: AppUserProfile): Promise<NoticeSummary | null> {
  const supabase = await createSupabaseServerWriteClient();
  const notice =
    supabase
      ? await supabase
          .from("notices")
          .select("*")
          .eq("id", noticeId)
          .maybeSingle()
          .then(({ data, error }) => (error || !data ? null : mapNoticeRow(data)))
      : await getNoticeById(noticeId);

  if (!notice) {
    return null;
  }

  if (!isAdminRole(profile) && !isNonArchivedContentStatus(notice.status)) {
    return null;
  }

  const spaces = await listManageableNoticeSpaces(profile);
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
