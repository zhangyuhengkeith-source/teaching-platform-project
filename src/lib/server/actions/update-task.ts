"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { updateTask } from "@/lib/mutations/electives";
import { getTaskById } from "@/lib/queries/tasks";
import { canManageSpace } from "@/lib/permissions/spaces";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { updateTaskSchema } from "@/lib/validations/electives";
import { getChangeActionFromStatusTransition } from "@/lib/status/content-status";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";

export async function updateTaskAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = updateTaskSchema.parse(input);
  const existing = await getTaskById(parsed.id);

  if (!existing) {
    throw new Error("Task not found.");
  }

  const space = await getSpaceById(existing.spaceId);
  if (!space) {
    throw new Error("Parent space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    throw new Error("You do not have permission to update this task.");
  }

  const nextSubmissionMode = parsed.submission_mode ?? existing.submissionMode;
  if (space.type === "class" && nextSubmissionMode !== "individual") {
    throw new Error("Class tasks currently support individual submission only.");
  }

  const updated = await updateTask(parsed);
  if (space.type === "class") {
    await notifyClassContentChanged({
      classId: space.id,
      contentType: "assignment",
      contentId: updated.id,
      actionType: getChangeActionFromStatusTransition(existing.status, updated.status),
      title: updated.title,
    });
  }
  const adminEditPath = space.type === "class" ? `/admin/classes/${space.id}/edit` : `/admin/electives/${space.id}/edit`;
  const learnerRootPath = space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`;

  revalidatePath(space.type === "class" ? "/admin/classes" : "/admin/electives");
  revalidatePath(adminEditPath);
  revalidatePath(learnerRootPath);
  revalidatePath(`${learnerRootPath}/tasks/${existing.slug}`);
  revalidatePath(`${learnerRootPath}/tasks/${updated.slug}`);

  return updated;
}
