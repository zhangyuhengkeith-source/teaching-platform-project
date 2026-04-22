import {
  mapTaskRow,
  mapTaskSubmissionFileRow,
  mapTaskSubmissionRow,
} from "@/lib/db/mappers";
import {
  seedSubmissionFiles,
  seedTaskSubmissions,
  seedTasks,
} from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findSpaceById } from "@/repositories/space-repository";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type { CreateTaskInput, UpdateTaskInput } from "@/types/api";
import type { TaskSubmissionSummary, TaskSummary } from "@/types/domain";

async function enrichTask(task: TaskSummary): Promise<TaskSummary> {
  const space = await findSpaceById(task.spaceId);

  return {
    ...task,
    spaceTitle: task.spaceTitle ?? space?.title,
    spaceSlug: task.spaceSlug ?? space?.slug,
  };
}

// Migration seam: keep task record access and task-level submission reads behind a provider-neutral repository.
export async function listTasksBySpaceId(spaceId: string): Promise<TaskSummary[]> {
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

export async function findTaskById(taskId: string): Promise<TaskSummary | null> {
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

export async function listTaskSubmissionsByTaskId(taskId: string): Promise<TaskSubmissionSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Promise.all(
      seedTaskSubmissions.filter((submission) => submission.taskId === taskId).map(async (submission) => ({
        ...submission,
        files: submission.files ?? seedSubmissionFiles.filter((file) => file.submissionId === submission.id),
      })),
    );
  }

  const { data, error } = await supabase
    .from("task_submissions")
    .select("*, task_submission_files(*)")
    .eq("task_id", taskId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapTaskSubmissionRow(row, row.task_submission_files?.map(mapTaskSubmissionFileRow)));
}

export async function createTaskRecord(profileId: string, input: CreateTaskInput): Promise<TaskSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const task: TaskSummary = {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      chapterId: input.chapter_id ?? null,
      title: input.title,
      slug: input.slug,
      brief: input.brief ?? null,
      body: input.body ?? null,
      submissionMode: input.submission_mode,
      dueAt: input.deadline ?? input.due_at ?? null,
      deadline: input.deadline ?? input.due_at ?? null,
      publishAt: input.publish_at ?? null,
      allowResubmission: input.allow_resubmission ?? true,
      templateResourceId: input.template_resource_id ?? null,
      status: input.status ?? "draft",
      createdBy: profileId,
      createdAt: nowInShanghaiIso(),
      updatedAt: nowInShanghaiIso(),
    };

    seedTasks.unshift(task);
    return task;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      space_id: input.space_id,
      chapter_id: input.chapter_id ?? null,
      title: input.title,
      slug: input.slug,
      brief: input.brief ?? null,
      body: input.body ?? null,
      submission_mode: input.submission_mode,
      due_at: input.deadline ?? input.due_at ?? null,
      deadline: input.deadline ?? input.due_at ?? null,
      publish_at: input.publish_at ?? null,
      allow_resubmission: input.allow_resubmission ?? true,
      template_resource_id: input.template_resource_id ?? null,
      status: input.status ?? "draft",
      created_by: profileId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create task.");
  }

  return mapTaskRow(data);
}

export async function updateTaskRecord(input: UpdateTaskInput): Promise<TaskSummary> {
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
      chapterId: input.chapter_id ?? task.chapterId,
      dueAt: input.deadline ?? input.due_at ?? task.dueAt,
      deadline: input.deadline ?? input.due_at ?? task.deadline,
      publishAt: input.publish_at ?? task.publishAt,
      allowResubmission: input.allow_resubmission ?? task.allowResubmission,
      templateResourceId: input.template_resource_id ?? task.templateResourceId,
      status: input.status ?? task.status,
      updatedAt: nowInShanghaiIso(),
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
      chapter_id: input.chapter_id,
      due_at: input.deadline ?? input.due_at,
      deadline: input.deadline ?? input.due_at,
      publish_at: input.publish_at,
      allow_resubmission: input.allow_resubmission,
      template_resource_id: input.template_resource_id,
      status: input.status,
      archived_at: input.status === "archived" ? nowInShanghaiIso() : undefined,
      deleted_at: input.status === "deleted" ? nowInShanghaiIso() : undefined,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update task.");
  }

  return mapTaskRow(data);
}

export async function deleteTaskRecord(taskId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const task = seedTasks.find((entry) => entry.id === taskId);
    if (task) {
      task.status = "deleted";
      task.updatedAt = nowInShanghaiIso();
    }

    return;
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "deleted",
      deleted_at: nowInShanghaiIso(),
    })
    .eq("id", taskId);
  if (error) {
    throw new Error(error.message);
  }
}
