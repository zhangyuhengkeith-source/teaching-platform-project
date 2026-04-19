"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUsersAccess } from "@/lib/auth/require-admin-users-access";
import { assignProfileToSpace } from "@/lib/mutations/spaces";
import { getSpaceById } from "@/lib/queries/spaces";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { findProfileById } from "@/repositories/profile-repository";

const assignStudentToElectiveSchema = z.object({
  profile_id: z.string().uuid(),
  space_id: z.string().uuid(),
});

export async function assignStudentToElectiveAction(input: unknown) {
  await requireAdminUsersAccess();
  const parsed = assignStudentToElectiveSchema.parse(input);

  const [profile, space] = await Promise.all([findProfileById(parsed.profile_id), getSpaceById(parsed.space_id)]);

  if (!profile) {
    throw new Error("The selected user does not exist.");
  }

  const membershipRole = profile.role === "teacher" ? "teacher" : profile.role === "student" && profile.userType === "internal" ? "student" : null;

  if (!membershipRole) {
    throw new Error("Only teacher accounts or internal student accounts can be assigned to electives.");
  }

  if (!space || space.type !== "elective") {
    throw new Error("The selected elective does not exist.");
  }

  const writeClient = await createSupabaseServerWriteClient({ requireServiceRole: true });
  const membership = await assignProfileToSpace(
    {
      ...parsed,
      membership_role: membershipRole,
    },
    writeClient ?? undefined,
  );

  revalidatePath("/admin/users");
  revalidatePath("/waiting-assignment");
  revalidatePath("/dashboard");
  revalidatePath("/electives");

  return membership;
}
