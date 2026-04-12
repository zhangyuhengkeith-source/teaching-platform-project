"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { removeGroupMember } from "@/lib/mutations/electives";
import { getGroupById } from "@/lib/queries/electives";
import { getManageableElectiveById } from "@/lib/queries/electives";
import { removeGroupMemberSchema } from "@/lib/validations/electives";

export async function removeGroupMemberAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = removeGroupMemberSchema.parse(input);
  const group = await getGroupById(parsed.group_id);

  if (!group) {
    throw new Error("Group not found.");
  }

  const space = await getManageableElectiveById(group.spaceId, profile);
  if (!space) {
    throw new Error("You do not have permission to manage this elective group.");
  }

  if (group.leaderProfileId === parsed.profile_id) {
    throw new Error("Remove or reassign the leader through a dedicated workflow before removing that member.");
  }

  await removeGroupMember(parsed);
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${group.id}`);
  revalidatePath(`/electives/${space.slug}/group`);
}
