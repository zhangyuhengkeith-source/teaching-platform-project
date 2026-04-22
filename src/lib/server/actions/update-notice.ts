"use server";

import { revalidatePath } from "next/cache";

import { updateNotice } from "@/lib/mutations/notices";
import { getNoticeById } from "@/lib/queries/notices";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { updateNoticeSchema } from "@/lib/validations/notices";
import { requireAuth } from "@/lib/auth/require-auth";
import { canManageNotice } from "@/lib/permissions/notices";
import { getChangeActionFromStatusTransition } from "@/lib/status/content-status";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";

export async function updateNoticeAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = updateNoticeSchema.parse(input);
  const notice = await getNoticeById(parsed.id);

  if (!notice) {
    throw new Error("Notice not found.");
  }

  const space = await getSpaceById(parsed.space_id ?? notice.spaceId);
  if (!space) {
    throw new Error("Parent space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageNotice(profile, { notice, space, memberships })) {
    throw new Error("You do not have permission to update this notice.");
  }

  const updated = await updateNotice(profile.id, {
    ...parsed,
    space_id: parsed.space_id ?? notice.spaceId,
  });
  if (space.type === "class") {
    await notifyClassContentChanged({
      classId: space.id,
      contentType: "announcement",
      contentId: updated.id,
      actionType: getChangeActionFromStatusTransition(notice.status, updated.status),
      title: updated.title,
    });
  }
  revalidatePath("/admin/notices");
  if (space.type === "class") {
    revalidatePath(`/admin/classes/${space.id}/announcements`);
  }
  revalidatePath("/classes");
  revalidatePath("/electives");
  revalidatePath(space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`);
  return updated;
}
