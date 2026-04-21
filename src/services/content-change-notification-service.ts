import { mapContentChangeNotificationRow } from "@/lib/db/mappers";
import { seedChangeNotifications, seedMemberships, seedProfiles } from "@/lib/seed/seed";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type { ChangeNotificationActionType, ChangeNotificationContentType, ContentChangeNotificationSummary } from "@/types/domain";

export interface NotifyClassContentChangeInput {
  classId: string;
  contentType: ChangeNotificationContentType;
  contentId: string;
  actionType: ChangeNotificationActionType;
  title: string;
  message?: string;
}

const contentTypeLabels: Record<ChangeNotificationContentType, string> = {
  announcement: "公告",
  chapter: "章节",
  resource: "资源",
  assignment: "任务",
  practice_set: "练习",
  student_group: "小组",
};

const actionLabels: Record<ChangeNotificationActionType, string> = {
  edited: "已更新",
  archived: "已归档",
  deleted: "已删除",
};

export function buildContentChangeMessage(input: Pick<NotifyClassContentChangeInput, "contentType" | "actionType" | "title" | "message">) {
  if (input.message?.trim()) {
    return input.message.trim();
  }

  return `${contentTypeLabels[input.contentType]}「${input.title}」${actionLabels[input.actionType]}。`;
}

async function listAffectedStudentIds(classId: string) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });

  if (!supabase) {
    const activeStudentIds = seedProfiles.filter((profile) => profile.role === "student" && profile.userType === "internal" && profile.status === "active").map((profile) => profile.id);
    return seedMemberships
      .filter((membership) => membership.spaceId === classId && membership.status === "active" && membership.membershipRole === "student" && activeStudentIds.includes(membership.profileId))
      .map((membership) => membership.profileId);
  }

  const { data, error } = await supabase
    .from("space_memberships")
    .select("profile_id, profiles!inner(role, user_type, status)")
    .eq("space_id", classId)
    .eq("status", "active")
    .eq("membership_role", "student")
    .eq("profiles.role", "student")
    .eq("profiles.user_type", "internal")
    .eq("profiles.status", "active");

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load affected students.");
  }

  return data.map((membership) => membership.profile_id);
}

export async function notifyClassContentChanged(input: NotifyClassContentChangeInput) {
  const studentIds = await listAffectedStudentIds(input.classId);
  const message = buildContentChangeMessage(input);

  if (studentIds.length === 0) {
    return 0;
  }

  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  const createdAt = nowInShanghaiIso();

  if (!supabase) {
    for (const studentId of studentIds) {
      const existing = seedChangeNotifications.find(
        (notification) =>
          notification.userId === studentId &&
          notification.contentType === input.contentType &&
          notification.contentId === input.contentId &&
          !notification.isRead,
      );

      if (existing) {
        Object.assign(existing, {
          classId: input.classId,
          actionType: input.actionType,
          message,
          createdAt,
        });
      } else {
        seedChangeNotifications.unshift({
          id: crypto.randomUUID(),
          userId: studentId,
          classId: input.classId,
          contentType: input.contentType,
          contentId: input.contentId,
          actionType: input.actionType,
          message,
          isRead: false,
          readAt: null,
          createdAt,
        });
      }
    }

    return studentIds.length;
  }

  for (const studentId of studentIds) {
    const { data: existing, error: existingError } = await supabase
      .from("content_change_notifications")
      .select("id")
      .eq("user_id", studentId)
      .eq("content_type", input.contentType)
      .eq("content_id", input.contentId)
      .eq("is_read", false)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      const { error } = await supabase
        .from("content_change_notifications")
        .update({
          class_id: input.classId,
          action_type: input.actionType,
          message,
          created_at: createdAt,
        })
        .eq("id", existing.id);

      if (error) {
        throw new Error(error.message);
      }
      continue;
    }

    const { error } = await supabase.from("content_change_notifications").insert({
      user_id: studentId,
      class_id: input.classId,
      content_type: input.contentType,
      content_id: input.contentId,
      action_type: input.actionType,
      message,
      created_at: createdAt,
    });

    if (error) {
      if (error.code !== "23505") {
        throw new Error(error.message);
      }

      const { error: updateError } = await supabase
        .from("content_change_notifications")
        .update({
          class_id: input.classId,
          action_type: input.actionType,
          message,
          created_at: createdAt,
        })
        .eq("user_id", studentId)
        .eq("content_type", input.contentType)
        .eq("content_id", input.contentId)
        .eq("is_read", false);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }

  return studentIds.length;
}

export async function listUnreadChangeNotificationsForStudent(userId: string): Promise<ContentChangeNotificationSummary[]> {
  const supabase = await createSupabaseServerWriteClient();

  if (!supabase) {
    return seedChangeNotifications
      .filter((notification) => notification.userId === userId && !notification.isRead)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data, error } = await supabase
    .from("content_change_notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load notifications.");
  }

  return data.map(mapContentChangeNotificationRow);
}

export async function markChangeNotificationsReadForStudent(userId: string, notificationIds: string[]) {
  const ids = [...new Set(notificationIds)].filter(Boolean);

  if (ids.length === 0) {
    return 0;
  }

  const readAt = nowInShanghaiIso();
  const supabase = await createSupabaseServerWriteClient();

  if (!supabase) {
    let count = 0;
    for (const notification of seedChangeNotifications) {
      if (notification.userId === userId && ids.includes(notification.id) && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = readAt;
        count += 1;
      }
    }
    return count;
  }

  const { data, error } = await supabase
    .from("content_change_notifications")
    .update({ is_read: true, read_at: readAt })
    .eq("user_id", userId)
    .eq("is_read", false)
    .in("id", ids)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return data?.length ?? 0;
}
