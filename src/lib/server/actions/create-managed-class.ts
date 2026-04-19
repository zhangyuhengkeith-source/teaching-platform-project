"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUsersAccess } from "@/lib/auth/require-admin-users-access";
import { createSpace } from "@/lib/mutations/spaces";
import { createSpaceSchema } from "@/lib/validations/spaces";
import type { CreateSpaceActionResult } from "@/lib/server/actions/create-space";

export async function createManagedClassAction(input: unknown) {
  try {
    const profile = await requireAdminUsersAccess();
    const parsed = createSpaceSchema.parse({
      ...(typeof input === "object" && input !== null ? input : {}),
      type: "class",
    });
    await createSpace(profile.id, parsed);

    revalidatePath("/admin/users");
    revalidatePath("/admin/classes");
    revalidatePath("/classes");

    return { ok: true } satisfies CreateSpaceActionResult;
  } catch (error) {
    console.error("Failed to create managed class.", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create managed class.",
    } satisfies CreateSpaceActionResult;
  }
}
