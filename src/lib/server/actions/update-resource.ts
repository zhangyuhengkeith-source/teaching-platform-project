"use server";

import { revalidatePath } from "next/cache";

import { updateResource } from "@/lib/mutations/resources";
import { getResourceById } from "@/lib/queries/resources";
import { getSpaceById, listMembershipsForSpace, listSectionsForSpace } from "@/lib/queries/spaces";
import { updateResourceSchema } from "@/lib/validations/resources";
import { requireAuth } from "@/lib/auth/require-auth";
import { canManageResource } from "@/lib/permissions/resources";
import { canManageSpace } from "@/lib/permissions/spaces";
import { getChangeActionFromStatusTransition } from "@/lib/status/content-status";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";

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

  const targetSpaceId = parsed.space_id ?? resource.spaceId;
  let targetSpace = space;
  if (targetSpaceId !== resource.spaceId) {
    const nextTargetSpace = await getSpaceById(targetSpaceId);
    if (!nextTargetSpace) {
      throw new Error("Target space not found.");
    }

    const targetMemberships = await listMembershipsForSpace(nextTargetSpace.id);
    if (!canManageSpace(profile, { space: nextTargetSpace, memberships: targetMemberships })) {
      throw new Error("You do not have permission to move this resource into the selected space.");
    }

    targetSpace = nextTargetSpace;
  }

  if (parsed.section_id) {
    const sections = await listSectionsForSpace(targetSpaceId);
    if (!sections.some((section) => section.id === parsed.section_id)) {
      throw new Error("Selected section does not belong to the chosen space.");
    }
  }

  const updated = await updateResource(profile.id, {
    ...parsed,
    space_id: targetSpaceId,
  });
  if (targetSpace.type === "class") {
    await notifyClassContentChanged({
      classId: targetSpace.id,
      contentType: "resource",
      contentId: updated.id,
      actionType: getChangeActionFromStatusTransition(resource.status, updated.status),
      title: updated.title,
    });
  }
  revalidatePath("/admin/resources");
  revalidatePath("/classes");
  return updated;
}
