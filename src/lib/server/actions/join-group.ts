"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { joinGroup } from "@/lib/mutations/electives";
import { canCreateOrJoinGroup } from "@/lib/permissions/electives";
import { getGroupById, getGroupForUserInElective } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { joinGroupSchema } from "@/lib/validations/electives";

export async function joinGroupAction(input: unknown) {
  const profile = await requireElectiveViewer();
  const parsed = joinGroupSchema.parse(input);
  const group = await getGroupById(parsed.group_id);

  if (!group) {
    throw new Error("Group not found.");
  }

  const space = await getSpaceById(group.spaceId);
  if (!space || space.type !== "elective") {
    throw new Error("Elective not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canCreateOrJoinGroup(profile, { space, memberships })) {
    throw new Error("Grouping is closed or you do not have access to this elective.");
  }

  const existing = await getGroupForUserInElective(space.id, profile.id);
  if (existing) {
    throw new Error("You already belong to an active group in this elective.");
  }

  const activeMembers = group.members.filter((member) => member.status === "active").length;
  if (activeMembers >= (space.maxGroupSize ?? 4)) {
    throw new Error("This group has reached the elective size limit.");
  }

  if (group.status === "locked" || group.status === "archived") {
    throw new Error("This group is no longer accepting members.");
  }

  const updated = await joinGroup(profile, parsed);
  revalidatePath("/electives");
  revalidatePath(`/electives/${space.slug}`);
  revalidatePath(`/electives/${space.slug}/group`);
  revalidatePath("/admin/groups");

  return updated;
}
