"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { updateGroup } from "@/lib/mutations/electives";
import { canEditGroup } from "@/lib/permissions/electives";
import { getGroupById, listAllGroupsForElective } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { generateGroupCode } from "@/lib/utils/group-code";
import { updateGroupSchema } from "@/lib/validations/electives";

export interface UpdateGroupActionResult {
  ok: boolean;
  error?: string;
}

export async function updateGroupAction(input: unknown) {
  try {
    const profile = await requireElectiveViewer();
    const parsed = updateGroupSchema.parse(input);
    const existing = await getGroupById(parsed.id);

    if (!existing) {
      return { ok: false, error: "Group not found." } satisfies UpdateGroupActionResult;
    }

    const space = await getSpaceById(existing.spaceId);
    if (!space || space.type !== "elective") {
      return { ok: false, error: "Elective not found." } satisfies UpdateGroupActionResult;
    }

    const memberships = await listMembershipsForSpace(space.id);
    if (!canEditGroup(profile, existing, { space, memberships })) {
      return { ok: false, error: "You do not have permission to update this group." } satisfies UpdateGroupActionResult;
    }

    if (parsed.name) {
      const nextGroupName = parsed.name;
      const existingGroups = await listAllGroupsForElective(space.id);
      const duplicateName = existingGroups.some(
        (group) => group.id !== existing.id && group.name.trim().toLowerCase() === nextGroupName.trim().toLowerCase(),
      );

      if (duplicateName) {
        return { ok: false, error: "A group with this name already exists in the elective." } satisfies UpdateGroupActionResult;
      }
    }

    const updated = await updateGroup(profile, {
      ...parsed,
      slug: generateGroupCode(existing.leaderProfileId, parsed.name ?? existing.name),
      leader_profile_id: undefined,
    });

    revalidatePath("/electives");
    revalidatePath(`/electives/${space.slug}`);
    revalidatePath(`/electives/${space.slug}/group`);
    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${updated.id}`);

    return { ok: true } satisfies UpdateGroupActionResult;
  } catch (error) {
    console.error("Failed to update group.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update group.",
    } satisfies UpdateGroupActionResult;
  }
}
