"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { removeGroupMember } from "@/lib/mutations/electives";
import { getGroupById } from "@/lib/queries/electives";
import { getManageableElectiveById } from "@/lib/queries/electives";
import { removeGroupMemberSchema } from "@/lib/validations/electives";

export interface RemoveGroupMemberActionResult {
  ok: boolean;
  error?: string;
}

export async function removeGroupMemberAction(input: unknown) {
  try {
    const profile = await requireRole(["super_admin", "teacher"]);
    const parsed = removeGroupMemberSchema.parse(input);
    const group = await getGroupById(parsed.group_id);

    if (!group) {
      return { ok: false, error: "Group not found." } satisfies RemoveGroupMemberActionResult;
    }

    const space = await getManageableElectiveById(group.spaceId, profile);
    if (!space) {
      return { ok: false, error: "You do not have permission to manage this elective group." } satisfies RemoveGroupMemberActionResult;
    }

    if (group.leaderProfileId === parsed.profile_id) {
      return {
        ok: false,
        error: "Remove or reassign the leader through a dedicated workflow before removing that member.",
      } satisfies RemoveGroupMemberActionResult;
    }

    await removeGroupMember(parsed);
    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${group.id}`);
    revalidatePath(`/electives/${space.slug}/group`);
    return { ok: true } satisfies RemoveGroupMemberActionResult;
  } catch (error) {
    console.error("Failed to remove group member.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to remove group member.",
    } satisfies RemoveGroupMemberActionResult;
  }
}
