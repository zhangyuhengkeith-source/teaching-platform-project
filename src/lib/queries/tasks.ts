import {
  mapTaskRow,
  mapTaskSubmissionFileRow,
  mapTaskSubmissionRow,
} from "@/lib/db/mappers";
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
import {
  seedSubmissionFiles,
  seedTaskSubmissions,
  seedTasks,
} from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

async function enrichTask(task: TaskSummary): Promise<TaskSummary> {
  const space = await getSpaceById(task.spaceId);
  return {
    ...task,
    spaceTitle: task.spaceTitle ?? space?.title,
    spaceSlug: task.spaceSlug ?? space?.slug,
  };
}

async function listTasksRawForSpace(spaceId: string): Promise<TaskSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Promise.all(seedTasks.filter((task) => task.spaceId === spaceId).map(enrichTask));
  }

  const { data, error } = await supabase.from("tasks").select("*").eq("space_id", spaceId).order("due_at", { ascending: true });
  if (error || !data) {
    return [];
  }

  return Promise.all(data.map((row) => enrichTask(mapTaskRow(row))));
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
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const task = seedTasks.find((entry) => entry.id === taskId) ?? null;
    return task ? enrichTask(task) : null;
  }

  const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return enrichTask(mapTaskRow(data));
}

async function listSubmissionFiles(submissionId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSubmissionFiles.filter((file) => file.submissionId === submissionId);
  }

  const { data, error } = await supabase.from("task_submission_files").select("*").eq("submission_id", submissionId);
  if (error || !data) {
    return [];
  }

  return data.map(mapTaskSubmissionFileRow);
}

async function listSubmissionsRawForTask(taskId: string): Promise<TaskSubmissionSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Promise.all(
      seedTaskSubmissions.filter((submission) => submission.taskId === taskId).map(async (submission) => ({
        ...submission,
        files: submission.files ?? (await listSubmissionFiles(submission.id)),
      })),
    );
  }

  const { data, error } = await supabase.from("task_submissions").select("*, task_submission_files(*)").eq("task_id", taskId).order("updated_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  const profileIds = [...new Set(data.flatMap((row) => [row.submitter_profile_id, row.feedback_by].filter(Boolean) as string[]))];
  const groupIds = [...new Set(data.flatMap((row) => (row.submitter_group_id ? [row.submitter_group_id] : [])))];
  const [profiles, groups] = await Promise.all([listProfilesByIds(profileIds), Promise.all(groupIds.map((id) => getGroupById(id)))]);
  const profileMap = Object.fromEntries(profiles.map((profile) => [profile.id, profile.fullName]));
  const groupMap = Object.fromEntries(groups.filter(Boolean).map((group) => [group!.id, group!.name]));

  return data.map((row) => ({
    ...mapTaskSubmissionRow(row, row.task_submission_files?.map(mapTaskSubmissionFileRow)),
    submitterName: row.submitter_profile_id ? profileMap[row.submitter_profile_id] ?? row.submitter_profile_id : null,
    groupName: row.submitter_group_id ? groupMap[row.submitter_group_id] ?? row.submitter_group_id : null,
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
