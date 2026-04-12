"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { updateGroup } from "@/lib/mutations/electives";
import { canEditGroup } from "@/lib/permissions/electives";
import { getGroupById } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { updateGroupSchema } from "@/lib/validations/electives";

export async function updateGroupAction(input: unknown) {
  const profile = await requireElectiveViewer();
  const parsed = updateGroupSchema.parse(input);
  const existing = await getGroupById(parsed.id);

  if (!existing) {
    throw new Error("Group not found.");
  }

  const space = await getSpaceById(existing.spaceId);
  if (!space || space.type !== "elective") {
    throw new Error("Elective not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canEditGroup(profile, existing, { space, memberships })) {
    throw new Error("You do not have permission to update this group.");
  }

  const updated = await updateGroup(profile, {
    ...parsed,
    leader_profile_id: undefined,
  });

  revalidatePath("/electives");
  revalidatePath(`/electives/${space.slug}`);
  revalidatePath(`/electives/${space.slug}/group`);
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${updated.id}`);

  return updated;
}
