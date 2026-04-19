"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { joinGroup } from "@/lib/mutations/electives";
import { canCreateOrJoinGroup } from "@/lib/permissions/electives";
import { getGroupById, getGroupForUserInElective } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { joinGroupSchema } from "@/lib/validations/electives";

export interface JoinGroupActionResult {
  ok: boolean;
  error?: string;
}

export async function joinGroupAction(input: unknown) {
  try {
    const profile = await requireElectiveViewer();
    const parsed = joinGroupSchema.parse(input);
    const group = await getGroupById(parsed.group_id);

    if (!group) {
      return { ok: false, error: "Group not found." } satisfies JoinGroupActionResult;
    }

    const space = await getSpaceById(group.spaceId);
    if (!space || space.type !== "elective") {
      return { ok: false, error: "Elective not found." } satisfies JoinGroupActionResult;
    }

    const memberships = await listMembershipsForSpace(space.id);
    if (!canCreateOrJoinGroup(profile, { space, memberships })) {
      return { ok: false, error: "Grouping is closed or you do not have access to this elective." } satisfies JoinGroupActionResult;
    }

    const existing = await getGroupForUserInElective(space.id, profile.id);
    if (existing) {
      return { ok: false, error: "You already belong to an active group in this elective." } satisfies JoinGroupActionResult;
    }

    const activeMembers = group.members.filter((member) => member.status === "active").length;
    if (activeMembers >= (space.maxGroupSize ?? 4)) {
      return { ok: false, error: "This group has reached the elective size limit." } satisfies JoinGroupActionResult;
    }

    if (group.status === "locked" || group.status === "archived") {
      return { ok: false, error: "This group is no longer accepting members." } satisfies JoinGroupActionResult;
    }

    await joinGroup(profile, parsed);
    revalidatePath("/electives");
    revalidatePath(`/electives/${space.slug}`);
    revalidatePath(`/electives/${space.slug}/group`);
    revalidatePath("/admin/groups");

    return { ok: true } satisfies JoinGroupActionResult;
  } catch (error) {
    console.error("Failed to join group.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to join group.",
    } satisfies JoinGroupActionResult;
  }
}
