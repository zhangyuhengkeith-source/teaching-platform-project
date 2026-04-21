"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { normalizeClassScopedInput } from "@/lib/auth/class-permissions";
import { createTask } from "@/lib/mutations/electives";
import { canManageSpace } from "@/lib/permissions/spaces";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { createTaskSchema } from "@/lib/validations/electives";

export async function createTaskAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = createTaskSchema.parse(normalizeClassScopedInput(input));
  const space = await getSpaceById(parsed.space_id);

  if (!space) {
    throw new Error("Space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    throw new Error("You do not have permission to create tasks for this space.");
  }

  if (space.type === "class" && parsed.submission_mode !== "individual") {
    throw new Error("Class tasks currently support individual submission only.");
  }

  const task = await createTask(profile, parsed);
  const adminEditPath = space.type === "class" ? `/admin/classes/${space.id}/edit` : `/admin/electives/${space.id}/edit`;
  const learnerRootPath = space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`;

  revalidatePath(space.type === "class" ? "/admin/classes" : "/admin/electives");
  revalidatePath(adminEditPath);
  revalidatePath(learnerRootPath);
  revalidatePath(`${learnerRootPath}/tasks/${task.slug}`);

  return task;
}
