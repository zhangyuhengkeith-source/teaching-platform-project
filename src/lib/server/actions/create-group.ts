"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { createGroup } from "@/lib/mutations/electives";
import { canCreateOrJoinGroup, canManageElective } from "@/lib/permissions/electives";
import { getGroupForUserInElective } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { createGroupSchema } from "@/lib/validations/electives";

export interface CreateGroupActionResult {
  ok: boolean;
  error?: string;
}

export async function createGroupAction(input: unknown) {
  try {
    const profile = await requireElectiveViewer();
    const parsed = createGroupSchema.parse(input);
    const space = await getSpaceById(parsed.space_id);

    if (!space || space.type !== "elective") {
      return { ok: false, error: "Elective not found." } satisfies CreateGroupActionResult;
    }

    const memberships = await listMembershipsForSpace(space.id);
    const canManage = canManageElective(profile, { space, memberships });
    const canParticipate = canCreateOrJoinGroup(profile, { space, memberships });

    if (!canManage && !canParticipate) {
      return { ok: false, error: "You do not have permission to create a group in this elective." } satisfies CreateGroupActionResult;
    }

    const existing = await getGroupForUserInElective(space.id, profile.id);
    if (existing) {
      return { ok: false, error: "You already belong to an active group in this elective." } satisfies CreateGroupActionResult;
    }

    await createGroup(
      profile,
      {
        ...parsed,
        leader_profile_id: canManage ? parsed.leader_profile_id ?? profile.id : profile.id,
      },
      space,
    );

    revalidatePath("/electives");
    revalidatePath(`/electives/${space.slug}`);
    revalidatePath(`/electives/${space.slug}/group`);
    revalidatePath("/admin/groups");

    return { ok: true } satisfies CreateGroupActionResult;
  } catch (error) {
    console.error("Failed to create group.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create group.",
    } satisfies CreateGroupActionResult;
  }
}
