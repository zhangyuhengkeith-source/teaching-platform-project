"use server";

import { revalidatePath } from "next/cache";

import { updateSpace } from "@/lib/mutations/spaces";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { updateSpaceSchema } from "@/lib/validations/spaces";
import { requireAuth } from "@/lib/auth/require-auth";
import { canManageSpace } from "@/lib/permissions/spaces";

export async function updateSpaceAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = updateSpaceSchema.parse(input);
  const space = await getSpaceById(parsed.id);

  if (!space) {
    throw new Error("Space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    throw new Error("You do not have permission to update this space.");
  }

  const updated = await updateSpace(parsed);
  revalidatePath("/admin/classes");
  revalidatePath(`/classes/${space.slug}`);
  revalidatePath(`/classes/${updated.slug}`);
  revalidatePath("/classes");
  return updated;
}
