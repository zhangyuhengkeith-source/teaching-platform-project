"use server";

import { revalidatePath } from "next/cache";

import { createResource } from "@/lib/mutations/resources";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { createResourceSchema } from "@/lib/validations/resources";
import { requireAuth } from "@/lib/auth/require-auth";
import { canManageSpace } from "@/lib/permissions/spaces";

export async function createResourceAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = createResourceSchema.parse(input);
  const space = await getSpaceById(parsed.space_id);

  if (!space) {
    throw new Error("Space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    throw new Error("You do not have permission to create resources in this space.");
  }

  const resource = await createResource(profile.id, parsed);
  revalidatePath("/admin/resources");
  revalidatePath("/classes");
  return resource;
}
