import {
  mapGroupMemberRow,
  mapGroupRow,
} from "@/lib/db/mappers";
import { canManageElective, canViewElective, canViewGroup, canViewSubmission, canViewTask } from "@/lib/permissions/electives";
import { isSuperAdmin } from "@/lib/permissions/profiles";
import { listProfilesByIds } from "@/lib/queries/profiles";
import {
  getSpaceById,
  getSpaceBySlugForUser,
  listAllElectiveSpaces,
  listMembershipsForSpace,
  listSpacesForUser,
} from "@/lib/queries/spaces";
import {
  seedGroupMembers,
  seedGroups,
  seedProfiles,
  seedSpaces,
} from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findTaskById, listTaskSubmissionsByTaskId, listTasksBySpaceId } from "@/repositories/task-repository";
import type { AppUserProfile } from "@/types/auth";
import type { GroupDetail, GroupMemberSummary, GroupSummary, SpaceDetail, SpaceSummary, TaskDetail, TaskSubmissionSummary, TaskSummary } from "@/types/domain";

function enrichGroup(group: GroupSummary, members: GroupMemberSummary[]): GroupDetail {
  const leader = seedProfiles.find((profile) => profile.id === group.leaderProfileId);
  const space = seedSpaces.find((entry) => entry.id === group.spaceId);
  const leaderMember = members.find((member) => member.profileId === group.leaderProfileId && member.status === "active");

  return {
    ...group,
    members,
    leaderName: group.leaderName ?? leaderMember?.profileName ?? leader?.fullName ?? null,
    memberCount: members.filter((member) => member.status === "active").length,
    spaceTitle: group.spaceTitle ?? space?.title,
    spaceSlug: group.spaceSlug ?? space?.slug,
  };
}

function applySubmissionEffectiveStatus(submission: TaskSubmissionSummary, dueAt: string | null): TaskSubmissionSummary {
  const overdue = Boolean(dueAt && (submission.status === "draft" || submission.status === "returned") && new Date(dueAt).getTime() < Date.now());
  return {
    ...submission,
    taskDueAt: dueAt,
    effectiveStatus: overdue && submission.status === "draft" ? "overdue" : submission.status,
  };
}

export async function listElectiveSpacesForUser(profile: AppUserProfile): Promise<SpaceSummary[]> {
  if (isSuperAdmin(profile)) {
    return listAllElectiveSpaces();
  }

  const spaces = await listSpacesForUser(profile.id);
  return spaces.filter((space) => space.type === "elective");
}

export async function listManageableElectiveSpaces(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const spaces = await listElectiveSpacesForUser(profile);
  const checks = await Promise.all(
    spaces.map(async (space) => ({
      space,
      memberships: await listMembershipsForSpace(space.id),
    })),
  );

  return checks.filter(({ space, memberships }) => canManageElective(profile, { space, memberships })).map(({ space }) => space);
}

export async function getElectiveSpaceBySlugForUser(slug: string, profile: AppUserProfile): Promise<SpaceDetail | null> {
  const space = await getSpaceBySlugForUser(slug, profile);
  if (!space || space.type !== "elective") {
    return null;
  }

  if (!canViewElective(profile, { space, memberships: space.memberships })) {
    return null;
  }

  return space;
}

export async function getManageableElectiveById(spaceId: string, profile: AppUserProfile): Promise<SpaceSummary | null> {
  const space = await getSpaceById(spaceId);
  if (!space || space.type !== "elective") {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  return canManageElective(profile, { space, memberships }) ? space : null;
}

export async function listGroupMembers(groupId: string): Promise<GroupMemberSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedGroupMembers.filter((member) => member.groupId === groupId);
  }

  const { data, error } = await supabase.from("group_members").select("*").eq("group_id", groupId);
  if (error || !data) {
    return [];
  }

  const mapped = data.map(mapGroupMemberRow);
  const profiles = await listProfilesByIds([...new Set(mapped.map((member) => member.profileId))]);
  const profileMap = Object.fromEntries(profiles.map((profile) => [profile.id, profile.fullName]));
  return mapped.map((member) => ({
    ...member,
    profileName: profileMap[member.profileId] ?? member.profileId,
  }));
}

async function listGroupsRawForElective(spaceId: string): Promise<GroupDetail[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Promise.all(
      seedGroups
        .filter((group) => group.spaceId === spaceId)
        .map(async (group) => enrichGroup(group, await listGroupMembers(group.id))),
    );
  }

  const { data, error } = await supabase.from("groups").select("*").eq("space_id", spaceId).order("updated_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  return Promise.all(
    data.map(async (row) => enrichGroup(mapGroupRow(row), await listGroupMembers(row.id))),
  );
}

export async function listAllGroupsForElective(spaceId: string): Promise<GroupDetail[]> {
  return listGroupsRawForElective(spaceId);
}

export async function listGroupsForElective(spaceId: string, profile: AppUserProfile): Promise<GroupDetail[]> {
  const space = await getSpaceById(spaceId);
  if (!space) {
    return [];
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canViewElective(profile, { space, memberships })) {
    return [];
  }

  const groups = await listGroupsRawForElective(space.id);
  if (canManageElective(profile, { space, memberships })) {
    return groups;
  }

  return groups.filter((group) => canViewGroup(profile, group, { space, memberships }) || group.status === "forming");
}

export async function getGroupForUserInElective(spaceId: string, profileId: string): Promise<GroupDetail | null> {
  const groups = await listGroupsRawForElective(spaceId);
  return groups.find((group) => group.members.some((member) => member.profileId === profileId && member.status === "active")) ?? null;
}

export async function getGroupById(groupId: string): Promise<GroupDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const group = seedGroups.find((entry) => entry.id === groupId) ?? null;
    return group ? enrichGroup(group, await listGroupMembers(group.id)) : null;
  }

  const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return enrichGroup(mapGroupRow(data), await listGroupMembers(data.id));
}

export async function getGroupBySlugForElective(spaceId: string, groupSlug: string, profile: AppUserProfile): Promise<GroupDetail | null> {
  const groups = await listGroupsForElective(spaceId, profile);
  return groups.find((group) => group.slug === groupSlug) ?? null;
}

export async function listManageableGroups(profile: AppUserProfile): Promise<GroupDetail[]> {
  const electives = await listManageableElectiveSpaces(profile);
  return (await Promise.all(electives.map((space) => listGroupsRawForElective(space.id)))).flat();
}

async function listTasksRawForElective(spaceId: string): Promise<TaskSummary[]> {
  return listTasksBySpaceId(spaceId);
}

export async function listTasksForElective(spaceId: string, profile: AppUserProfile): Promise<TaskSummary[]> {
  const space = await getSpaceById(spaceId);
  if (!space) {
    return [];
  }

  const memberships = await listMembershipsForSpace(spaceId);
  const tasks = await listTasksRawForElective(spaceId);
  return tasks.filter((task) => canViewTask(profile, task, { space, memberships }));
}

export async function listManageableTasksForElective(spaceId: string, profile: AppUserProfile): Promise<TaskSummary[]> {
  const space = await getManageableElectiveById(spaceId, profile);
  if (!space) {
    return [];
  }

  return listTasksRawForElective(space.id);
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

export async function getTaskBySlugForUser(spaceSlug: string, taskSlug: string, profile: AppUserProfile): Promise<TaskDetail | null> {
  const space = await getElectiveSpaceBySlugForUser(spaceSlug, profile);
  if (!space) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  const task = (await listTasksRawForElective(space.id)).find((entry) => entry.slug === taskSlug) ?? null;
  if (!task || !canViewTask(profile, task, { space, memberships })) {
    return null;
  }

  const group = await getGroupForUserInElective(space.id, profile.id);
  const submission = await getSubmissionForTaskAndUserOrGroup(task, profile, group);

  return {
    ...task,
    submission,
  };
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
  if (!canManageElective(profile, { space, memberships })) {
    return [];
  }

  return (await listSubmissionsRawForTask(taskId)).map((submission) => applySubmissionEffectiveStatus(submission, task.dueAt));
}

export async function listManageableSubmissions(profile: AppUserProfile): Promise<TaskSubmissionSummary[]> {
  const electives = await listManageableElectiveSpaces(profile);
  const tasks = (await Promise.all(electives.map((space) => listTasksRawForElective(space.id)))).flat();
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
