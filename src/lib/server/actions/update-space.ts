"use server";

import { revalidatePath } from "next/cache";

import { updateSpace } from "@/lib/mutations/spaces";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { updateSpaceSchema } from "@/lib/validations/spaces";
import { requireAuth } from "@/lib/auth/require-auth";
import { canManageSpace } from "@/lib/permissions/spaces";
import { isAdminRole } from "@/lib/permissions/profiles";
import { submitClassUpdateRequest } from "@/lib/server/class-approval-service";

export interface UpdateSpaceActionResult {
  ok: boolean;
  pendingApproval?: boolean;
  error?: string;
}

export async function updateSpaceAction(input: unknown): Promise<UpdateSpaceActionResult> {
  try {
    const profile = await requireAuth();
    const parsed = updateSpaceSchema.parse(input);
    const space = await getSpaceById(parsed.id);

    if (!space) {
      throw new Error("Space not found.");
    }

    const memberships = await listMembershipsForSpace(space.id);
    if (!canManageSpace(profile, { space, memberships })) {
      throw new Error("You do not have permission to update this space.");
    }

    if (space.type === "class" && !isAdminRole(profile)) {
      await submitClassUpdateRequest(profile, parsed);
      revalidatePath("/admin");
      revalidatePath("/admin/classes");
      return { ok: true, pendingApproval: true };
    }

    const updated = await updateSpace(parsed);
    revalidatePath("/admin");
    revalidatePath("/admin/classes");
    revalidatePath(`/classes/${space.slug}`);
    revalidatePath(`/classes/${updated.slug}`);
    revalidatePath("/classes");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update space." };
  }
}
