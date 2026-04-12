"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createTask } from "@/lib/mutations/electives";
import { getManageableElectiveById } from "@/lib/queries/electives";
import { createTaskSchema } from "@/lib/validations/electives";

export async function createTaskAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = createTaskSchema.parse(input);
  const elective = await getManageableElectiveById(parsed.space_id, profile);

  if (!elective) {
    throw new Error("You do not have permission to create tasks for this elective.");
  }

  const task = await createTask(profile, parsed);
  revalidatePath("/admin/electives");
  revalidatePath(`/admin/electives/${elective.id}/edit`);
  revalidatePath(`/electives/${elective.slug}`);
  revalidatePath(`/electives/${elective.slug}/tasks/${task.slug}`);

  return task;
}
