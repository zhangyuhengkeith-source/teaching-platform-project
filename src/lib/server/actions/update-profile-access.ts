"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUsersAccess } from "@/lib/auth/require-admin-users-access";
import { updateProfileAccess } from "@/lib/mutations/profiles";

const updateProfileAccessSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["super_admin", "teacher", "student"]),
  user_type: z.enum(["internal", "external"]),
  status: z.enum(["active", "inactive", "suspended"]),
});

export async function updateProfileAccessAction(input: unknown) {
  await requireAdminUsersAccess();
  const parsed = updateProfileAccessSchema.parse(input);
  const updated = await updateProfileAccess(parsed);

  revalidatePath("/admin/users");

  return updated;
}
