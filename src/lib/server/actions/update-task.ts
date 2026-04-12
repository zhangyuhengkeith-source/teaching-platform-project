"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { updateTask } from "@/lib/mutations/electives";
import { getManageableElectiveById, getTaskById } from "@/lib/queries/electives";
import { updateTaskSchema } from "@/lib/validations/electives";

export async function updateTaskAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = updateTaskSchema.parse(input);
  const existing = await getTaskById(parsed.id);

  if (!existing) {
    throw new Error("Task not found.");
  }

  const elective = await getManageableElectiveById(existing.spaceId, profile);
  if (!elective) {
    throw new Error("You do not have permission to update this task.");
  }

  const updated = await updateTask(parsed);
  revalidatePath("/admin/electives");
  revalidatePath(`/admin/electives/${elective.id}/edit`);
  revalidatePath(`/electives/${elective.slug}`);
  revalidatePath(`/electives/${elective.slug}/tasks/${existing.slug}`);
  revalidatePath(`/electives/${elective.slug}/tasks/${updated.slug}`);

  return updated;
}
