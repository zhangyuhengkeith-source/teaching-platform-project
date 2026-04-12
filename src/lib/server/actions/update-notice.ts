"use server";

import { revalidatePath } from "next/cache";

import { updateNotice } from "@/lib/mutations/notices";
import { getNoticeById } from "@/lib/queries/notices";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { updateNoticeSchema } from "@/lib/validations/notices";
import { requireAuth } from "@/lib/auth/require-auth";
import { canManageNotice } from "@/lib/permissions/notices";

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
  revalidatePath("/admin/notices");
  revalidatePath("/classes");
  return updated;
}
