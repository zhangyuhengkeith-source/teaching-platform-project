"use server";

import { revalidatePath } from "next/cache";

import { requireElectiveViewer } from "@/lib/auth/require-elective-access";
import { submitTaskSubmission } from "@/lib/mutations/electives";
import { canEditSubmission } from "@/lib/permissions/electives";
import { getGroupForUserInElective, getSubmissionForTaskAndUserOrGroup, getTaskById } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { submissionDraftSchema } from "@/lib/validations/electives";

export async function submitTaskSubmissionAction(input: unknown) {
  const profile = await requireElectiveViewer();
  const parsed = submissionDraftSchema.parse(input);
  const task = await getTaskById(parsed.task_id);

  if (!task) {
    throw new Error("Task not found.");
  }

  const space = await getSpaceById(task.spaceId);
  if (!space || space.type !== "elective") {
    throw new Error("Elective not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  const group = await getGroupForUserInElective(space.id, profile.id);
  const submission = await getSubmissionForTaskAndUserOrGroup(task, profile, group);

  if (task.submissionMode === "group" && !group) {
    throw new Error("Join a group before submitting this task.");
  }

  if (!canEditSubmission(profile, submission, group, task, { space, memberships })) {
    throw new Error("You do not have permission to submit this work.");
  }

  const saved = await submitTaskSubmission(profile, { task, group }, parsed);
  revalidatePath(`/electives/${space.slug}`);
  revalidatePath(`/electives/${space.slug}/tasks/${task.slug}`);
  revalidatePath("/admin/submissions");

  return saved;
}
