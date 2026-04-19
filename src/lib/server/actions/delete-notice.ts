"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/require-auth";
import { deleteNotice } from "@/lib/mutations/notices";
import { canManageNotice } from "@/lib/permissions/notices";
import { getManageableNoticeById } from "@/lib/queries/notices";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";

export async function deleteNoticeAction(noticeId: string) {
  const profile = await requireAuth();
  const notice = await getManageableNoticeById(noticeId, profile);

  if (!notice) {
    throw new Error("Notice not found.");
  }

  const space = await getSpaceById(notice.spaceId);
  if (!space) {
    throw new Error("Parent space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageNotice(profile, { notice, space, memberships })) {
    throw new Error("You do not have permission to delete this notice.");
  }

  await deleteNotice(notice.id);

  revalidatePath("/admin/notices");
  revalidatePath("/classes");
  revalidatePath("/electives");
  revalidatePath(space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`);
}
