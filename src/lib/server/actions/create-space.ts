"use server";

import { revalidatePath } from "next/cache";

import { createSpace } from "@/lib/mutations/spaces";
import { createSpaceSchema } from "@/lib/validations/spaces";
import { requireAuth } from "@/lib/auth/require-auth";
import { isTeacher } from "@/lib/permissions/profiles";

export interface CreateSpaceActionResult {
  ok: boolean;
  error?: string;
}

export async function createSpaceAction(input: unknown) {
  try {
    const profile = await requireAuth();
    if (!isTeacher(profile)) {
      return { ok: false, error: "You do not have permission to create a space." } satisfies CreateSpaceActionResult;
    }

    const parsed = createSpaceSchema.parse(input);
    await createSpace(profile.id, parsed);
    revalidatePath("/admin/classes");
    revalidatePath("/classes");
    return { ok: true } satisfies CreateSpaceActionResult;
  } catch (error) {
    console.error("Failed to create space.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create space.",
    } satisfies CreateSpaceActionResult;
  }
}
