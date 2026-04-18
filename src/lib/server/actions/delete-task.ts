"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { deleteTask } from "@/lib/mutations/electives";
import { canManageSpace } from "@/lib/permissions/spaces";
import { getTaskById } from "@/lib/queries/tasks";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";

export async function deleteTaskAction(taskId: string) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const task = await getTaskById(taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  const space = await getSpaceById(task.spaceId);
  if (!space) {
    throw new Error("Parent space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    throw new Error("You do not have permission to delete this task.");
  }

  await deleteTask(task.id);

  const adminEditPath = space.type === "class" ? `/admin/classes/${space.id}/edit` : `/admin/electives/${space.id}/edit`;
  const learnerRootPath = space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`;

  revalidatePath(space.type === "class" ? "/admin/classes" : "/admin/electives");
  revalidatePath(adminEditPath);
  revalidatePath("/admin/submissions");
  revalidatePath(learnerRootPath);
  revalidatePath(`${learnerRootPath}/tasks/${task.slug}`);
}
