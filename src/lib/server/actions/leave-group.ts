"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { leaveGroup } from "@/lib/mutations/electives";
import { canLeaveGroup } from "@/lib/permissions/electives";
import { getGroupById } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { leaveGroupSchema } from "@/lib/validations/electives";

export async function leaveGroupAction(input: unknown) {
  const profile = await requireElectiveViewer();
  const parsed = leaveGroupSchema.parse(input);
  const group = await getGroupById(parsed.group_id);

  if (!group) {
    throw new Error("Group not found.");
  }

  const space = await getSpaceById(group.spaceId);
  if (!space || space.type !== "elective") {
    throw new Error("Elective not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canLeaveGroup(profile, group, { space, memberships })) {
    throw new Error("You cannot leave this group right now.");
  }

  await leaveGroup(profile, parsed);
  revalidatePath("/electives");
  revalidatePath(`/electives/${space.slug}`);
  revalidatePath(`/electives/${space.slug}/group`);
  revalidatePath("/admin/groups");
}
