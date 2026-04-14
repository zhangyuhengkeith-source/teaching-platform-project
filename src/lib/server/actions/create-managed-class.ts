"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUsersAccess } from "@/lib/auth/require-admin-users-access";
import { createSpace } from "@/lib/mutations/spaces";
import { createSpaceSchema } from "@/lib/validations/spaces";

export async function createManagedClassAction(input: unknown) {
  const profile = await requireAdminUsersAccess();
  const parsed = createSpaceSchema.parse({
    ...(typeof input === "object" && input !== null ? input : {}),
    type: "class",
  });
  const space = await createSpace(profile.id, parsed);

  revalidatePath("/admin/users");
  revalidatePath("/admin/classes");
  revalidatePath("/classes");

  return space;
}
