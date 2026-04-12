"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createElectiveSpace } from "@/lib/mutations/electives";
import { createElectiveSchema } from "@/lib/validations/electives";

export async function createElectiveAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = createElectiveSchema.parse(input);
  const elective = await createElectiveSpace(profile.id, parsed);

  revalidatePath("/admin/electives");
  revalidatePath("/electives");

  return elective;
}
