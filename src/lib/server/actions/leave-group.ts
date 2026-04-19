"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { leaveGroup } from "@/lib/mutations/electives";
import { canLeaveGroup } from "@/lib/permissions/electives";
import { getGroupById } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { leaveGroupSchema } from "@/lib/validations/electives";

export interface LeaveGroupActionResult {
  ok: boolean;
  error?: string;
}

export async function leaveGroupAction(input: unknown) {
  try {
    const profile = await requireElectiveViewer();
    const parsed = leaveGroupSchema.parse(input);
    const group = await getGroupById(parsed.group_id);

    if (!group) {
      return { ok: false, error: "Group not found." } satisfies LeaveGroupActionResult;
    }

    const space = await getSpaceById(group.spaceId);
    if (!space || space.type !== "elective") {
      return { ok: false, error: "Elective not found." } satisfies LeaveGroupActionResult;
    }

    const memberships = await listMembershipsForSpace(space.id);
    if (!canLeaveGroup(profile, group, { space, memberships })) {
      return { ok: false, error: "You cannot leave this group right now." } satisfies LeaveGroupActionResult;
    }

    await leaveGroup(profile, parsed);
    revalidatePath("/electives");
    revalidatePath(`/electives/${space.slug}`);
    revalidatePath(`/electives/${space.slug}/group`);
    revalidatePath("/admin/groups");
    return { ok: true } satisfies LeaveGroupActionResult;
  } catch (error) {
    console.error("Failed to leave group.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to leave group.",
    } satisfies LeaveGroupActionResult;
  }
}
