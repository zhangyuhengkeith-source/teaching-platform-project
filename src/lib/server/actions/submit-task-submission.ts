"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/require-auth";
import { submitTaskSubmission } from "@/lib/mutations/electives";
import { canEditSubmission } from "@/lib/permissions/tasks";
import { getGroupForUserInElective } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { getSubmissionForTaskAndUserOrGroup, getTaskById } from "@/lib/queries/tasks";
import { submissionDraftSchema } from "@/lib/validations/electives";

export async function submitTaskSubmissionAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = submissionDraftSchema.parse(input);
  const task = await getTaskById(parsed.task_id);

  if (!task) {
    throw new Error("Task not found.");
  }

  const space = await getSpaceById(task.spaceId);
  if (!space || (space.type !== "elective" && space.type !== "class")) {
    throw new Error("Space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  const group = space.type === "elective" ? await getGroupForUserInElective(space.id, profile.id) : null;
  const submission = await getSubmissionForTaskAndUserOrGroup(task, profile, group);

  if (task.submissionMode === "group" && !group) {
    throw new Error("Join a group before submitting this task.");
  }

  if (!canEditSubmission(profile, submission, group, task, { space, memberships })) {
    throw new Error("You do not have permission to submit this work.");
  }

  const saved = await submitTaskSubmission(profile, { task, group }, parsed);
  const learnerRootPath = space.type === "class" ? `/classes/${space.slug}` : `/electives/${space.slug}`;

  revalidatePath(learnerRootPath);
  revalidatePath(`${learnerRootPath}/tasks/${task.slug}`);
  revalidatePath("/admin/submissions");

  return saved;
}
