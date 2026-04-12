"use server";

import { revalidatePath } from "next/cache";

import { createSpace } from "@/lib/mutations/spaces";
import { createSpaceSchema } from "@/lib/validations/spaces";
import { requireAuth } from "@/lib/auth/require-auth";
import { isTeacher } from "@/lib/permissions/profiles";

export async function createSpaceAction(input: unknown) {
  const profile = await requireAuth();
  if (!isTeacher(profile)) {
    throw new Error("You do not have permission to create a space.");
  }

  const parsed = createSpaceSchema.parse(input);
  const space = await createSpace(profile.id, parsed);
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  return space;
}
