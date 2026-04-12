"use server";

import { revalidatePath } from "next/cache";

import { updateResource } from "@/lib/mutations/resources";
import { getResourceById } from "@/lib/queries/resources";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { updateResourceSchema } from "@/lib/validations/resources";
import { requireAuth } from "@/lib/auth/require-auth";
import { canManageResource } from "@/lib/permissions/resources";

export async function updateResourceAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = updateResourceSchema.parse(input);
  const resource = await getResourceById(parsed.id);

  if (!resource) {
    throw new Error("Resource not found.");
  }

  const space = await getSpaceById(resource.spaceId);
  if (!space) {
    throw new Error("Parent space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageResource(profile, { resource, space, memberships })) {
    throw new Error("You do not have permission to update this resource.");
  }

  const updated = await updateResource(profile.id, {
    ...parsed,
    space_id: parsed.space_id ?? resource.spaceId,
  });
  revalidatePath("/admin/resources");
  revalidatePath("/classes");
  return updated;
}
