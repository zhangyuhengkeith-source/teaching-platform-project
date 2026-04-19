import { canManageTask, canViewTask } from "@/lib/permissions/tasks";
import { listProfilesByIds } from "@/lib/queries/profiles";
import {
  getManageableClassById,
  getSpaceById,
  getSpaceBySlugForUser,
  listManageableClasses,
  listMembershipsForSpace,
} from "@/lib/queries/spaces";
import {
  getGroupById,
  getGroupForUserInElective,
  listManageableElectiveSpaces,
} from "@/lib/queries/electives";
import { findTaskById, listTaskSubmissionsByTaskId, listTasksBySpaceId } from "@/repositories/task-repository";
import type { AppUserProfile } from "@/types/auth";
import type { GroupDetail, SpaceSummary, TaskDetail, TaskSubmissionSummary, TaskSummary } from "@/types/domain";

function applySubmissionEffectiveStatus(submission: TaskSubmissionSummary, dueAt: string | null): TaskSubmissionSummary {
  const overdue = Boolean(dueAt && (submission.status === "draft" || submission.status === "returned") && new Date(dueAt).getTime() < Date.now());
  return {
    ...submission,
    taskDueAt: dueAt,
    effectiveStatus: overdue && submission.status === "draft" ? "overdue" : submission.status,
  };
}

async function listTasksRawForSpace(spaceId: string): Promise<TaskSummary[]> {
  return listTasksBySpaceId(spaceId);
}

export async function listTasksForSpace(spaceId: string, profile: AppUserProfile): Promise<TaskSummary[]> {
  const space = await getSpaceById(spaceId);
  if (!space) {
    return [];
  }

  const memberships = await listMembershipsForSpace(spaceId);
  const tasks = await listTasksRawForSpace(spaceId);
  return tasks.filter((task) => canViewTask(profile, task, { space, memberships }));
}

export async function listTasksForElective(spaceId: string, profile: AppUserProfile): Promise<TaskSummary[]> {
  const space = await getSpaceById(spaceId);
  if (!space || space.type !== "elective") {
    return [];
  }

  return listTasksForSpace(spaceId, profile);
}

export async function listTasksForClass(spaceId: string, profile: AppUserProfile): Promise<TaskSummary[]> {
  const space = await getManageableClassById(spaceId, profile) ?? (await getSpaceById(spaceId));
  if (!space || space.type !== "class") {
    return [];
  }

  return listTasksForSpace(spaceId, profile);
}

export async function listManageableTasksForSpace(spaceId: string, profile: AppUserProfile): Promise<TaskSummary[]> {
  const space = await getSpaceById(spaceId);
  if (!space) {
    return [];
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageTask(profile, { space, memberships })) {
    return [];
  }

  return listTasksRawForSpace(space.id);
}

export async function listManageableTasksForElective(spaceId: string, profile: AppUserProfile): Promise<TaskSummary[]> {
  const space = await getSpaceById(spaceId);
  if (!space || space.type !== "elective") {
    return [];
  }

  return listManageableTasksForSpace(spaceId, profile);
}

export async function getTaskById(taskId: string): Promise<TaskSummary | null> {
  return findTaskById(taskId);
}

async function listSubmissionsRawForTask(taskId: string): Promise<TaskSubmissionSummary[]> {
  const submissions = await listTaskSubmissionsByTaskId(taskId);
  const profileIds = [...new Set(submissions.flatMap((submission) => [submission.submitterProfileId, submission.feedbackBy].filter(Boolean) as string[]))];
  const groupIds = [...new Set(submissions.flatMap((submission) => (submission.submitterGroupId ? [submission.submitterGroupId] : [])))];
  const [profiles, groups] = await Promise.all([listProfilesByIds(profileIds), Promise.all(groupIds.map((id) => getGroupById(id)))]);
  const profileMap = Object.fromEntries(profiles.map((profile) => [profile.id, profile.fullName]));
  const groupMap = Object.fromEntries(groups.filter(Boolean).map((group) => [group!.id, group!.name]));

  return submissions.map((submission) => ({
    ...submission,
    submitterName: submission.submitterProfileId ? profileMap[submission.submitterProfileId] ?? submission.submitterProfileId : null,
    groupName: submission.submitterGroupId ? groupMap[submission.submitterGroupId] ?? submission.submitterGroupId : null,
  }));
}

export async function getSubmissionForTaskAndUserOrGroup(task: TaskSummary, profile: AppUserProfile, group: GroupDetail | null): Promise<TaskSubmissionSummary | null> {
  const submissions = await listSubmissionsRawForTask(task.id);
  const match =
    task.submissionMode === "group"
      ? submissions.find((submission) => submission.submitterGroupId === group?.id) ?? null
      : submissions.find((submission) => submission.submitterProfileId === profile.id) ?? null;

  return match ? applySubmissionEffectiveStatus(match, task.dueAt) : null;
}

export async function getTaskBySlugForSpace(spaceSlug: string, taskSlug: string, profile: AppUserProfile): Promise<{ space: SpaceSummary; task: TaskDetail } | null> {
  const space = await getSpaceBySlugForUser(spaceSlug, profile.id);
  if (!space) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  const task = (await listTasksRawForSpace(space.id)).find((entry) => entry.slug === taskSlug) ?? null;
  if (!task || !canViewTask(profile, task, { space, memberships })) {
    return null;
  }

  const group = space.type === "elective" ? await getGroupForUserInElective(space.id, profile.id) : null;
  const submission = await getSubmissionForTaskAndUserOrGroup(task, profile, group);

  return {
    space,
    task: {
      ...task,
      submission,
    },
  };
}

export async function getTaskBySlugForElective(spaceSlug: string, taskSlug: string, profile: AppUserProfile): Promise<TaskDetail | null> {
  const result = await getTaskBySlugForSpace(spaceSlug, taskSlug, profile);
  if (!result || result.space.type !== "elective") {
    return null;
  }

  return result.task;
}

export async function getTaskBySlugForClass(spaceSlug: string, taskSlug: string, profile: AppUserProfile): Promise<TaskDetail | null> {
  const result = await getTaskBySlugForSpace(spaceSlug, taskSlug, profile);
  if (!result || result.space.type !== "class") {
    return null;
  }

  return result.task;
}

export async function listSubmissionsForTask(taskId: string, profile: AppUserProfile): Promise<TaskSubmissionSummary[]> {
  const task = await getTaskById(taskId);
  if (!task) {
    return [];
  }

  const space = await getSpaceById(task.spaceId);
  if (!space) {
    return [];
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageTask(profile, { space, memberships })) {
    return [];
  }

  return (await listSubmissionsRawForTask(taskId)).map((submission) => applySubmissionEffectiveStatus(submission, task.dueAt));
}

export async function listManageableSubmissions(profile: AppUserProfile): Promise<TaskSubmissionSummary[]> {
  const [classes, electives] = await Promise.all([listManageableClasses(profile), listManageableElectiveSpaces(profile)]);
  const spaces = [...classes, ...electives];
  const tasks = (await Promise.all(spaces.map((space) => listTasksRawForSpace(space.id)))).flat();

  return (
    await Promise.all(
      tasks.map(async (task) => (await listSubmissionsRawForTask(task.id)).map((submission) => applySubmissionEffectiveStatus(submission, task.dueAt))),
    )
  ).flat();
}

export async function getManageableSubmissionById(submissionId: string, profile: AppUserProfile): Promise<TaskSubmissionSummary | null> {
  const submissions = await listManageableSubmissions(profile);
  return submissions.find((submission) => submission.id === submissionId) ?? null;
}
