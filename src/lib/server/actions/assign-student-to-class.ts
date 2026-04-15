"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminUsersAccess } from "@/lib/auth/require-admin-users-access";
import { assignStudentToClass } from "@/lib/mutations/spaces";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { getSpaceById } from "@/lib/queries/spaces";

const assignStudentToClassSchema = z.object({
  profile_id: z.string().uuid(),
  space_id: z.string().uuid(),
});

export async function assignStudentToClassAction(input: unknown) {
  await requireAdminUsersAccess();
  const parsed = assignStudentToClassSchema.parse(input);

  const [profile, space] = await Promise.all([getProfileByUserId(parsed.profile_id), getSpaceById(parsed.space_id)]);

  if (!profile) {
    throw new Error("The selected user does not exist.");
  }

  const membershipRole = profile.role === "teacher" ? "teacher" : profile.role === "student" && profile.userType === "internal" ? "student" : null;

  if (!membershipRole) {
    throw new Error("Only teacher accounts or internal student accounts can be assigned to classes.");
  }

  if (!space || space.type !== "class") {
    throw new Error("The selected class does not exist.");
  }

  const membership = await assignStudentToClass({
    ...parsed,
    membership_role: membershipRole,
  });

  revalidatePath("/admin/users");
  revalidatePath("/waiting-assignment");
  revalidatePath("/dashboard");
  revalidatePath("/classes");

  return membership;
}
