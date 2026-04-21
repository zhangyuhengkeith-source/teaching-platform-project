import { mapNoticeRow } from "@/lib/db/mappers";
import { seedNotices } from "@/lib/seed/seed";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type { CreateNoticeInput, UpdateNoticeInput } from "@/types/api";
import type { NoticeSummary } from "@/types/domain";

export async function createNotice(profileId: string, input: CreateNoticeInput): Promise<NoticeSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      title: input.title,
      body: input.body,
      noticeType: input.notice_type,
      publishAt: input.publish_at ?? null,
      expireAt: input.expire_at ?? null,
      isPinned: input.is_pinned ?? false,
      status: input.status ?? "draft",
    };
  }

  const { data, error } = await supabase
    .from("notices")
    .insert({
      space_id: input.space_id,
      title: input.title,
      body: input.body,
      notice_type: input.notice_type,
      publish_at: input.publish_at ?? null,
      expire_at: input.expire_at ?? null,
      is_pinned: input.is_pinned ?? false,
      status: input.status ?? "draft",
      created_by: profileId,
      updated_by: profileId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create notice.");
  }

  return mapNoticeRow(data);
}

export async function updateNotice(profileId: string, input: UpdateNoticeInput): Promise<NoticeSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: input.id,
      spaceId: input.space_id ?? "mock-space",
      title: input.title ?? "Untitled Notice",
      body: input.body ?? "",
      noticeType: input.notice_type ?? "general",
      publishAt: input.publish_at ?? null,
      expireAt: input.expire_at ?? null,
      isPinned: input.is_pinned ?? false,
      status: input.status ?? "draft",
    };
  }

  const { data, error } = await supabase
    .from("notices")
    .update({
      space_id: input.space_id,
      title: input.title,
      body: input.body,
      notice_type: input.notice_type,
      publish_at: input.publish_at,
      expire_at: input.expire_at,
      is_pinned: input.is_pinned,
      status: input.status,
      archived_at: input.status === "archived" ? nowInShanghaiIso() : undefined,
      deleted_at: input.status === "deleted" ? nowInShanghaiIso() : undefined,
      updated_by: profileId,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update notice.");
  }

  return mapNoticeRow(data);
}

export async function deleteNotice(noticeId: string): Promise<void> {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });

  if (!supabase) {
    const notice = seedNotices.find((entry) => entry.id === noticeId);
    if (notice) {
      notice.status = "deleted";
      notice.updatedAt = nowInShanghaiIso();
    }
    return;
  }

  const { error } = await supabase
    .from("notices")
    .update({
      status: "deleted",
      deleted_at: nowInShanghaiIso(),
    })
    .eq("id", noticeId);

  if (error) {
    throw new Error(error.message);
  }
}
