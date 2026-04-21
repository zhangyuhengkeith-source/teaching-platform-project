"use server";

import { revalidatePath } from "next/cache";

import { createNotice } from "@/lib/mutations/notices";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { createNoticeSchema } from "@/lib/validations/notices";
import { requireAuth } from "@/lib/auth/require-auth";
import { normalizeClassScopedInput } from "@/lib/auth/class-permissions";
import { canManageSpace } from "@/lib/permissions/spaces";

export async function createNoticeAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = createNoticeSchema.parse(normalizeClassScopedInput(input));
  const space = await getSpaceById(parsed.space_id);

  if (!space) {
    throw new Error("Space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    throw new Error("You do not have permission to create notices in this space.");
  }

  const notice = await createNotice(profile.id, parsed);
  revalidatePath("/admin/notices");
  revalidatePath("/classes");
  revalidatePath("/electives");
  revalidatePath(space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`);
  return notice;
}
