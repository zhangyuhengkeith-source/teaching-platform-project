"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { returnTaskSubmissionWithFeedback } from "@/lib/mutations/electives";
import { getSpaceById } from "@/lib/queries/spaces";
import { getTaskById } from "@/lib/queries/tasks";
import { submissionReviewSchema } from "@/lib/validations/electives";

export async function reviewTaskSubmissionAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = submissionReviewSchema.parse(input);
  const updated = await returnTaskSubmissionWithFeedback(profile, parsed);
  const task = await getTaskById(updated.taskId);
  const space = task ? await getSpaceById(task.spaceId) : null;

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${updated.id}`);

  if (space?.slug && task?.slug) {
    const learnerRootPath = space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`;
    revalidatePath(learnerRootPath);
    revalidatePath(`${learnerRootPath}/tasks/${task.slug}`);
  }

  return updated;
}
