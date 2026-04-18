import { mapGroupMemberRow, mapGroupRow, mapTaskRow, mapTaskSubmissionFileRow, mapTaskSubmissionRow } from "@/lib/db/mappers";
import { splitStorageFilePath } from "@/lib/db/storage";
import { getGroupById, getManageableSubmissionById } from "@/lib/queries/electives";
import {
  seedGroupMembers,
  seedGroups,
  seedSubmissionFiles,
  seedTaskSubmissions,
  seedTasks,
} from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateElectiveInput,
  CreateGroupInput,
  CreateTaskInput,
  CreateTaskSubmissionInput,
  JoinGroupInput,
  LeaveGroupInput,
  RemoveGroupMemberInput,
  ReviewTaskSubmissionInput,
  UpdateGroupInput,
  UpdateTaskInput,
  UpdateTaskSubmissionDraftInput,
} from "@/types/api";
import type { AppUserProfile } from "@/types/auth";
import type { GroupDetail, GroupMemberSummary, GroupSummary, SpaceSummary, SubmissionFileSummary, TaskSubmissionSummary, TaskSummary } from "@/types/domain";
import type { Json } from "@/types/database";
import { createSpace, updateSpace } from "@/lib/mutations/spaces";

function nowIso() {
  return new Date().toISOString();
}

function deriveSubmissionStatusForSubmit(currentStatus: TaskSubmissionSummary["status"] | undefined) {
  if (currentStatus === "returned") {
    return "resubmitted" as const;
  }
  return "submitted" as const;
}

type NormalizedSubmissionFileInput = {
  id?: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
};

function normalizeSubmissionFileMetadata(files: CreateTaskSubmissionInput["file_metadata"]): NormalizedSubmissionFileInput[] {
  return (files ?? []).map((file) => ({
    ...file,
    mime_type: file.mime_type ?? null,
    file_size: file.file_size ?? null,
  }));
}

function mapSubmissionFileInput(submissionId: string, file: NormalizedSubmissionFileInput): SubmissionFileSummary {
  return {
    id: file.id ?? crypto.randomUUID(),
    submissionId,
    filePath: file.file_path,
    fileName: file.file_name,
    mimeType: file.mime_type ?? null,
    fileSize: file.file_size ?? null,
    createdAt: nowIso(),
  };
}

async function removeStoredSubmissionFiles(filePaths: string[]) {
  const supabase = await createSupabaseServerClient();

  if (!supabase || filePaths.length === 0) {
    return;
  }

  const groupedPaths = new Map<string, string[]>();

  filePaths.forEach((filePath) => {
    const parsed = splitStorageFilePath(filePath);
    if (!parsed) {
      return;
    }

    groupedPaths.set(parsed.bucket, [...(groupedPaths.get(parsed.bucket) ?? []), parsed.objectPath]);
  });

  for (const [bucket, objectPaths] of groupedPaths.entries()) {
    const { error } = await supabase.storage.from(bucket).remove(objectPaths);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createElectiveSpace(ownerId: string, input: CreateElectiveInput) {
  return createSpace(ownerId, {
    title: input.title,
    slug: input.slug,
    type: "elective",
    description: input.description ?? null,
    academic_year: input.academic_year ?? null,
    status: input.status ?? "draft",
    grouping_locked: input.grouping_locked ?? false,
    max_group_size: input.max_group_size ?? 4,
  });
}

export async function updateElectiveSpace(input: {
  id: string;
  title?: string;
  slug?: string;
  description?: string | null;
  academic_year?: string | null;
  status?: "draft" | "published" | "archived";
  grouping_locked?: boolean;
  max_group_size?: number;
}) {
  return updateSpace({
    id: input.id,
    title: input.title,
    slug: input.slug,
    type: "elective",
    description: input.description,
    academic_year: input.academic_year,
    status: input.status,
    grouping_locked: input.grouping_locked,
    max_group_size: input.max_group_size,
  });
}

function enrichGroupSeed(group: GroupSummary): GroupDetail {
  const members = seedGroupMembers.filter((member) => member.groupId === group.id);
  return {
    ...group,
    members,
    memberCount: members.filter((member) => member.status === "active").length,
  };
}

export async function createGroup(profile: AppUserProfile, input: CreateGroupInput, space: SpaceSummary): Promise<GroupDetail> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const group: GroupSummary = {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      name: input.name,
      slug: input.slug,
      leaderProfileId: input.leader_profile_id ?? profile.id,
      projectTitle: input.project_title ?? null,
      projectSummary: input.project_summary ?? null,
      status: input.status ?? "forming",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      spaceTitle: space.title,
      spaceSlug: space.slug,
      leaderName: profile.fullName,
      memberCount: 1,
    };
    const member: GroupMemberSummary = {
      id: crypto.randomUUID(),
      groupId: group.id,
      profileId: profile.id,
      memberRole: "leader",
      joinedAt: nowIso(),
      status: "active",
      profileName: profile.fullName,
    };

    seedGroups.unshift(group);
    seedGroupMembers.unshift(member);
    return enrichGroupSeed(group);
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      space_id: input.space_id,
      name: input.name,
      slug: input.slug,
      leader_profile_id: input.leader_profile_id ?? profile.id,
      project_title: input.project_title ?? null,
      project_summary: input.project_summary ?? null,
      status: input.status ?? "forming",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create group.");
  }

  await supabase.from("group_members").insert({
    group_id: data.id,
    profile_id: profile.id,
    member_role: "leader",
    status: "active",
  });

  return {
    ...mapGroupRow(data),
    members: [{ id: crypto.randomUUID(), groupId: data.id, profileId: profile.id, memberRole: "leader", joinedAt: nowIso(), status: "active", profileName: profile.fullName }],
    spaceTitle: space.title,
    spaceSlug: space.slug,
    leaderName: profile.fullName,
    memberCount: 1,
  };
}

export async function joinGroup(profile: AppUserProfile, input: JoinGroupInput): Promise<GroupDetail> {
  const group = await getGroupById(input.group_id);
  if (!group) {
    throw new Error("Group not found.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const member: GroupMemberSummary = {
      id: crypto.randomUUID(),
      groupId: group.id,
      profileId: profile.id,
      memberRole: "member",
      joinedAt: nowIso(),
      status: "active",
      profileName: profile.fullName,
    };
    seedGroupMembers.push(member);
    return enrichGroupSeed({ ...group, updatedAt: nowIso() });
  }

  const { error } = await supabase.from("group_members").insert({
    group_id: group.id,
    profile_id: profile.id,
    member_role: "member",
    status: "active",
  });
  if (error) {
    throw new Error(error.message);
  }

  const reloaded = await getGroupById(group.id);
  if (!reloaded) {
    throw new Error("Group not found after join.");
  }
  return reloaded;
}

export async function leaveGroup(profile: AppUserProfile, input: LeaveGroupInput): Promise<void> {
  const group = await getGroupById(input.group_id);
  if (!group) {
    throw new Error("Group not found.");
  }

  const member = group.members.find((entry) => entry.profileId === profile.id && entry.status === "active");
  if (!member) {
    throw new Error("You are not an active member of this group.");
  }

  if (member.memberRole === "leader" && group.members.filter((entry) => entry.status === "active").length > 1) {
    throw new Error("Group leaders cannot leave while other active members remain.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const seedMember = seedGroupMembers.find((entry) => entry.groupId === group.id && entry.profileId === profile.id);
    if (seedMember) {
      seedMember.status = "removed";
    }
    return;
  }

  const { error } = await supabase.from("group_members").update({ status: "removed" }).eq("group_id", group.id).eq("profile_id", profile.id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateGroup(profile: AppUserProfile, input: UpdateGroupInput): Promise<GroupDetail> {
  const group = await getGroupById(input.id);
  if (!group) {
    throw new Error("Group not found.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const seedGroup = seedGroups.find((entry) => entry.id === input.id);
    if (!seedGroup) {
      throw new Error("Group not found.");
    }
    Object.assign(seedGroup, {
      name: input.name ?? seedGroup.name,
      slug: input.slug ?? seedGroup.slug,
      leaderProfileId: input.leader_profile_id ?? seedGroup.leaderProfileId,
      projectTitle: input.project_title ?? seedGroup.projectTitle,
      projectSummary: input.project_summary ?? seedGroup.projectSummary,
      status: input.status ?? seedGroup.status,
      updatedAt: nowIso(),
    });
    return enrichGroupSeed(seedGroup);
  }

  const { data, error } = await supabase
    .from("groups")
    .update({
      name: input.name,
      slug: input.slug,
      leader_profile_id: input.leader_profile_id,
      project_title: input.project_title,
      project_summary: input.project_summary,
      status: input.status,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update group.");
  }

  const reloaded = await getGroupById(data.id);
  if (!reloaded) {
    throw new Error("Group not found after update.");
  }
  return reloaded;
}

export async function removeGroupMember(input: RemoveGroupMemberInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const member = seedGroupMembers.find((entry) => entry.groupId === input.group_id && entry.profileId === input.profile_id);
    if (member) {
      member.status = "removed";
    }
    return;
  }

  const { error } = await supabase.from("group_members").update({ status: "removed" }).eq("group_id", input.group_id).eq("profile_id", input.profile_id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function createTask(profile: AppUserProfile, input: CreateTaskInput): Promise<TaskSummary> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const task: TaskSummary = {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      title: input.title,
      slug: input.slug,
      brief: input.brief ?? null,
      body: input.body ?? null,
      submissionMode: input.submission_mode,
      dueAt: input.due_at ?? null,
      allowResubmission: input.allow_resubmission ?? true,
      templateResourceId: input.template_resource_id ?? null,
      status: input.status ?? "draft",
      createdBy: profile.id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    seedTasks.unshift(task);
    return task;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      space_id: input.space_id,
      title: input.title,
      slug: input.slug,
      brief: input.brief ?? null,
      body: input.body ?? null,
      submission_mode: input.submission_mode,
      due_at: input.due_at ?? null,
      allow_resubmission: input.allow_resubmission ?? true,
      template_resource_id: input.template_resource_id ?? null,
      status: input.status ?? "draft",
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create task.");
  }

  return mapTaskRow(data);
}

export async function updateTask(input: UpdateTaskInput): Promise<TaskSummary> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const task = seedTasks.find((entry) => entry.id === input.id);
    if (!task) {
      throw new Error("Task not found.");
    }
    Object.assign(task, {
      title: input.title ?? task.title,
      slug: input.slug ?? task.slug,
      brief: input.brief ?? task.brief,
      body: input.body ?? task.body,
      submissionMode: input.submission_mode ?? task.submissionMode,
      dueAt: input.due_at ?? task.dueAt,
      allowResubmission: input.allow_resubmission ?? task.allowResubmission,
      templateResourceId: input.template_resource_id ?? task.templateResourceId,
      status: input.status ?? task.status,
      updatedAt: nowIso(),
    });
    return task;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: input.title,
      slug: input.slug,
      brief: input.brief,
      body: input.body,
      submission_mode: input.submission_mode,
      due_at: input.due_at,
      allow_resubmission: input.allow_resubmission,
      template_resource_id: input.template_resource_id,
      status: input.status,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update task.");
  }

  return mapTaskRow(data);
}

async function syncSubmissionFiles(submissionId: string, files: CreateTaskSubmissionInput["file_metadata"]) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (typeof files === "undefined") {
      return seedSubmissionFiles.filter((file) => file.submissionId === submissionId);
    }

    const normalizedFiles = normalizeSubmissionFileMetadata(files);
    const nextFiles = normalizedFiles.map((file) => mapSubmissionFileInput(submissionId, file));

    for (let index = seedSubmissionFiles.length - 1; index >= 0; index -= 1) {
      if (seedSubmissionFiles[index]?.submissionId === submissionId) {
        seedSubmissionFiles.splice(index, 1);
      }
    }

    seedSubmissionFiles.push(...nextFiles);
    return nextFiles;
  }

  const { data: existingFiles, error: existingFilesError } = await supabase
    .from("task_submission_files")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at");

  if (existingFilesError) {
    throw new Error(existingFilesError.message);
  }

  if (typeof files === "undefined") {
    return (existingFiles ?? []).map(mapTaskSubmissionFileRow);
  }

  const normalizedFiles = normalizeSubmissionFileMetadata(files);
  const keepFileIds = new Set(normalizedFiles.flatMap((file) => (file.id ? [file.id] : [])));
  const filesToDelete = (existingFiles ?? []).filter((file) => !keepFileIds.has(file.id));

  if (filesToDelete.length > 0) {
    await removeStoredSubmissionFiles(filesToDelete.map((file) => file.file_path));

    const { error: deleteError } = await supabase.from("task_submission_files").delete().in("id", filesToDelete.map((file) => file.id));
    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  const filesToKeep = normalizedFiles.filter((file): file is NormalizedSubmissionFileInput & { id: string } => typeof file.id === "string");
  for (const file of filesToKeep) {
    const { error: updateError } = await supabase
      .from("task_submission_files")
      .update({
        file_path: file.file_path,
        file_name: file.file_name,
        mime_type: file.mime_type ?? null,
        file_size: file.file_size ?? null,
      })
      .eq("id", file.id)
      .eq("submission_id", submissionId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  const filesToInsert = normalizedFiles
    .filter((file) => !file.id)
    .map((file) => ({
      submission_id: submissionId,
      file_path: file.file_path,
      file_name: file.file_name,
      mime_type: file.mime_type ?? null,
      file_size: file.file_size ?? null,
    }));

  if (filesToInsert.length > 0) {
    const { error: insertError } = await supabase.from("task_submission_files").insert(filesToInsert);
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const { data: syncedFiles, error: syncedFilesError } = await supabase
    .from("task_submission_files")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at");

  if (syncedFilesError || !syncedFiles) {
    throw new Error(syncedFilesError?.message ?? "Failed to load submission files.");
  }

  return syncedFiles.map(mapTaskSubmissionFileRow);
}

export async function updateTaskSubmissionDraft(
  profile: AppUserProfile,
  context: { task: TaskSummary; group: GroupDetail | null },
  input: UpdateTaskSubmissionDraftInput,
): Promise<TaskSubmissionSummary> {
  const supabase = await createSupabaseServerClient();
  const submitterProfileId = context.task.submissionMode === "individual" ? profile.id : null;
  const submitterGroupId = context.task.submissionMode === "group" ? context.group?.id ?? null : null;
  let existing: TaskSubmissionSummary | null = seedTaskSubmissions.find((entry) => entry.id === input.id) ?? null;

  if (!submitterProfileId && !submitterGroupId) {
    throw new Error("A valid submission context is required.");
  }

  if (supabase && input.id) {
    const { data } = await supabase.from("task_submissions").select("*, task_submission_files(*)").eq("id", input.id).maybeSingle();
    existing = data ? mapTaskSubmissionRow(data, data.task_submission_files?.map(mapTaskSubmissionFileRow)) : null;
  }

  if (!supabase) {
    if (existing) {
      Object.assign(existing, {
        textContent: input.text_content ?? null,
        contentJson: input.content_json ?? null,
        updatedAt: nowIso(),
      });
      existing.files = await syncSubmissionFiles(existing.id, input.file_metadata);
      return existing;
    }

    const created: TaskSubmissionSummary = {
      id: crypto.randomUUID(),
      taskId: context.task.id,
      submitterProfileId,
      submitterGroupId,
      status: "draft",
      submittedAt: null,
      contentJson: input.content_json ?? null,
      textContent: input.text_content ?? null,
      feedbackText: null,
      feedbackScore: null,
      feedbackBy: null,
      feedbackAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      taskTitle: context.task.title,
      taskSlug: context.task.slug,
      taskDueAt: context.task.dueAt,
      submitterName: submitterProfileId ? profile.fullName : null,
      groupName: submitterGroupId ? context.group?.name ?? null : null,
      files: [],
    };
    seedTaskSubmissions.unshift(created);
    created.files = await syncSubmissionFiles(created.id, input.file_metadata);
    return created;
  }

  const payload = {
    task_id: context.task.id,
    submitter_profile_id: submitterProfileId,
    submitter_group_id: submitterGroupId,
    text_content: input.text_content ?? null,
    content_json: (input.content_json ?? null) as Json | null,
    status: existing?.status ?? "draft",
  };

  const query = existing
    ? supabase.from("task_submissions").update(payload).eq("id", existing.id).select("*").single()
    : supabase.from("task_submissions").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save submission draft.");
  }

  const files = await syncSubmissionFiles(data.id, input.file_metadata);
  return {
    ...mapTaskSubmissionRow(data, files),
    taskTitle: context.task.title,
    taskSlug: context.task.slug,
    taskDueAt: context.task.dueAt,
    submitterName: submitterProfileId ? profile.fullName : null,
    groupName: submitterGroupId ? context.group?.name ?? null : null,
  };
}

export async function submitTaskSubmission(
  profile: AppUserProfile,
  context: { task: TaskSummary; group: GroupDetail | null },
  input: UpdateTaskSubmissionDraftInput,
): Promise<TaskSubmissionSummary> {
  const draft = await updateTaskSubmissionDraft(profile, context, input);
  const nextStatus = deriveSubmissionStatusForSubmit(draft.status);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    draft.status = nextStatus;
    draft.submittedAt = nowIso();
    draft.updatedAt = nowIso();
    return draft;
  }

  const { data, error } = await supabase
    .from("task_submissions")
    .update({
      status: nextStatus,
      submitted_at: nowIso(),
    })
    .eq("id", draft.id)
    .select("*, task_submission_files(*)")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to submit work.");
  }

  return {
    ...mapTaskSubmissionRow(data, data.task_submission_files?.map(mapTaskSubmissionFileRow)),
    taskTitle: context.task.title,
    taskSlug: context.task.slug,
    taskDueAt: context.task.dueAt,
    submitterName: draft.submitterName,
    groupName: draft.groupName,
  };
}

export async function returnTaskSubmissionWithFeedback(profile: AppUserProfile, input: ReviewTaskSubmissionInput): Promise<TaskSubmissionSummary> {
  const submission = await getManageableSubmissionById(input.submission_id, profile);
  if (!submission) {
    throw new Error("Submission not found.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const seedSubmission = seedTaskSubmissions.find((entry) => entry.id === input.submission_id);
    if (!seedSubmission) {
      throw new Error("Submission not found.");
    }
    Object.assign(seedSubmission, {
      feedbackText: input.feedback_text ?? null,
      feedbackScore: input.feedback_score ?? null,
      feedbackBy: profile.id,
      feedbackAt: nowIso(),
      status: input.status,
      updatedAt: nowIso(),
    });
    return seedSubmission;
  }

  const { data, error } = await supabase
    .from("task_submissions")
    .update({
      feedback_text: input.feedback_text ?? null,
      feedback_score: input.feedback_score ?? null,
      feedback_by: profile.id,
      feedback_at: nowIso(),
      status: input.status,
    })
    .eq("id", input.submission_id)
    .select("*, task_submission_files(*)")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update feedback.");
  }

  return {
    ...mapTaskSubmissionRow(data, data.task_submission_files?.map(mapTaskSubmissionFileRow)),
    taskTitle: submission.taskTitle,
    taskSlug: submission.taskSlug,
    taskDueAt: submission.taskDueAt,
    submitterName: submission.submitterName,
    groupName: submission.groupName,
  };
}
