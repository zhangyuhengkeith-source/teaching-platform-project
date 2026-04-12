"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { updateElectiveSpace } from "@/lib/mutations/electives";
import { getManageableElectiveById } from "@/lib/queries/electives";
import { updateElectiveSchema } from "@/lib/validations/electives";

export async function updateElectiveAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = updateElectiveSchema.parse(input);
  const existing = await getManageableElectiveById(parsed.id, profile);

  if (!existing) {
    throw new Error("Elective not found or not manageable.");
  }

  const updated = await updateElectiveSpace(parsed);
  revalidatePath("/admin/electives");
  revalidatePath(`/admin/electives/${updated.id}/edit`);
  revalidatePath("/electives");
  revalidatePath(`/electives/${existing.slug}`);
  revalidatePath(`/electives/${updated.slug}`);

  return updated;
}
