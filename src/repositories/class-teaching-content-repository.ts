import { createResourceRecord, findResourceById, updateResourceRecord } from "@/repositories/resource-repository";
import { createTaskRecord, findTaskById, updateTaskRecord } from "@/repositories/task-repository";
import { createExerciseSet, updateExerciseSet } from "@/lib/mutations/exercises";
import { getExerciseSetById } from "@/lib/queries/exercises";
import { mapExerciseSetRow, mapResourceRow, mapTaskRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import { resolveScheduledStatus, getPublishNowPatch } from "@/lib/teaching-content/scheduling";
import type { ExerciseSetStatus } from "@/lib/constants/statuses";
import type { ExerciseSetType } from "@/lib/constants/exercise-types";
import type { ResourceType } from "@/lib/constants/resource-types";
import type { SubmissionMode } from "@/lib/constants/elective-types";
import type { CreateExerciseSetInput, CreateResourceInput, CreateTaskInput, UpdateExerciseSetInput, UpdateResourceInput, UpdateTaskInput } from "@/types/api";
import type { ExerciseSetSummary, ResourceSummary, TaskSummary, CourseChapterItemSummary } from "@/types/domain";

export type TeachingContentModule = "resources" | "tasks" | "practice-sets";
export type TeachingContentListMode = "published" | "drafts" | "archived";

export interface TeachingContentFilters {
  mode?: TeachingContentListMode;
  chapterId?: string | null;
  type?: string | null;
  includeArchived?: boolean;
}

function isCurrentlyPublished(status: string, publishAt: string | null | undefined) {
  return status === "published" && (!publishAt || new Date(publishAt).getTime() <= Date.now());
}

function matchesMode(item: { status: string; publishAt?: string | null }, mode: TeachingContentListMode) {
  if (mode === "drafts") {
    return item.status === "draft";
  }

  if (mode === "archived") {
    return item.status === "archived";
  }

  return isCurrentlyPublished(item.status, item.publishAt);
}

function nullableChapterId(value: string | null | undefined) {
  return value && value !== "all" ? value : null;
}

export async function listChapterOptionsForClass(classId: string): Promise<CourseChapterItemSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("course_chapter_items")
    .select("*, course_chapter_sets!inner(class_id, status)")
    .eq("course_chapter_sets.class_id", classId)
    .neq("course_chapter_sets.status", "deleted")
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    chapterSetId: row.chapter_set_id,
    parentId: row.parent_id,
    level: row.level as CourseChapterItemSummary["level"],
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function chapterTitleMap(chapters: CourseChapterItemSummary[]) {
  return new Map(chapters.map((chapter) => [chapter.id, `${"  ".repeat(chapter.level - 1)}${chapter.title}`]));
}

export async function listClassResources(classId: string, filters: TeachingContentFilters = {}) {
  const mode = filters.mode ?? "published";
  const supabase = await createSupabaseServerClient();
  const chapters = await listChapterOptionsForClass(classId);
  const titles = chapterTitleMap(chapters);

  if (!supabase) {
    return [];
  }

  let query = supabase.from("resources").select("*, resource_files(*)").eq("space_id", classId).neq("status", "deleted");
  const chapterId = nullableChapterId(filters.chapterId);
  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }
  if (filters.type) {
    query = query.eq("resource_type", filters.type as ResourceType);
  }

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load resources.");
  }

  return data
    .map((row) => {
      const mapped = mapResourceRow(row, row.resource_files?.map((file) => ({
        id: file.id,
        filePath: file.file_path,
        fileName: file.file_name,
        fileExt: file.file_ext,
        mimeType: file.mime_type,
        fileSize: file.file_size,
        previewUrl: file.preview_url,
        sortOrder: file.sort_order,
      })));
      return { ...mapped, chapterTitle: mapped.chapterId ? titles.get(mapped.chapterId) ?? null : null };
    })
    .filter((item) => matchesMode({ status: item.status, publishAt: item.publishAt }, mode))
    .sort((a, b) => (b.publishAt ?? b.updatedAt ?? "").localeCompare(a.publishAt ?? a.updatedAt ?? ""));
}

export async function listClassTasks(classId: string, filters: TeachingContentFilters = {}) {
  const mode = filters.mode ?? "published";
  const supabase = await createSupabaseServerClient();
  const chapters = await listChapterOptionsForClass(classId);
  const titles = chapterTitleMap(chapters);

  if (!supabase) {
    return [];
  }

  let query = supabase.from("tasks").select("*").eq("space_id", classId).neq("status", "deleted");
  const chapterId = nullableChapterId(filters.chapterId);
  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }
  if (filters.type) {
    query = query.eq("submission_mode", filters.type as SubmissionMode);
  }

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load tasks.");
  }

  return data
    .map((row) => {
      const mapped = mapTaskRow(row);
      return { ...mapped, chapterTitle: mapped.chapterId ? titles.get(mapped.chapterId) ?? null : null };
    })
    .filter((item) => matchesMode({ status: item.status, publishAt: item.publishAt }, mode))
    .sort((a, b) => {
      const now = Date.now();
      const aOverdue = Boolean((a.deadline ?? a.dueAt) && new Date(a.deadline ?? a.dueAt!).getTime() < now);
      const bOverdue = Boolean((b.deadline ?? b.dueAt) && new Date(b.deadline ?? b.dueAt!).getTime() < now);
      if (aOverdue !== bOverdue && mode === "published") {
        return aOverdue ? -1 : 1;
      }
      return (a.publishAt ?? a.createdAt ?? "").localeCompare(b.publishAt ?? b.createdAt ?? "");
    });
}

export async function listClassPracticeSets(classId: string, filters: TeachingContentFilters = {}) {
  const mode = filters.mode ?? "published";
  const supabase = await createSupabaseServerClient();
  const chapters = await listChapterOptionsForClass(classId);
  const titles = chapterTitleMap(chapters);

  if (!supabase) {
    return [];
  }

  let query = supabase.from("exercise_sets").select("*").eq("space_id", classId).neq("status", "deleted");
  const chapterId = nullableChapterId(filters.chapterId);
  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }
  if (filters.type) {
    query = query.eq("exercise_type", filters.type as ExerciseSetType);
  }

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load practice sets.");
  }

  return data
    .map((row) => {
      const mapped = mapExerciseSetRow(row);
      return { ...mapped, chapterTitle: mapped.chapterId ? titles.get(mapped.chapterId) ?? null : null };
    })
    .filter((item) => matchesMode({ status: item.status, publishAt: item.publishAt }, mode))
    .sort((a, b) => (b.publishAt ?? b.updatedAt ?? "").localeCompare(a.publishAt ?? a.updatedAt ?? ""));
}

export async function createClassResource(profileId: string, classId: string, input: Omit<CreateResourceInput, "space_id" | "visibility">) {
  const publishAt = input.publish_at ?? null;
  return createResourceRecord(profileId, {
    ...input,
    space_id: classId,
    section_id: null,
    visibility: "space",
    sort_order: 0,
    status: resolveScheduledStatus(publishAt, input.status),
    publish_at: publishAt,
    published_at: publishAt,
  });
}

export async function updateClassResource(profileId: string, resource: ResourceSummary, input: Partial<UpdateResourceInput>) {
  const publishAt = input.publish_at ?? input.published_at ?? resource.publishAt ?? null;
  return updateResourceRecord(profileId, {
    id: resource.id,
    space_id: resource.spaceId,
    section_id: null,
    visibility: "space",
    ...input,
    publish_at: publishAt,
    published_at: publishAt,
    status: resolveScheduledStatus(publishAt, input.status ?? resource.status),
  });
}

export async function createClassTask(profileId: string, classId: string, input: Omit<CreateTaskInput, "space_id">) {
  const publishAt = input.publish_at ?? null;
  return createTaskRecord(profileId, {
    ...input,
    space_id: classId,
    brief: null,
    template_resource_id: null,
    due_at: input.deadline ?? input.due_at,
    deadline: input.deadline ?? input.due_at,
    publish_at: publishAt,
    status: resolveScheduledStatus(publishAt, input.status),
  });
}

export async function updateClassTask(task: TaskSummary, input: Partial<UpdateTaskInput>) {
  const publishAt = input.publish_at ?? task.publishAt ?? null;
  return updateTaskRecord({
    id: task.id,
    space_id: task.spaceId,
    ...input,
    brief: null,
    template_resource_id: null,
    due_at: input.deadline ?? input.due_at ?? task.deadline ?? task.dueAt,
    deadline: input.deadline ?? input.due_at ?? task.deadline ?? task.dueAt,
    publish_at: publishAt,
    status: resolveScheduledStatus(publishAt, input.status ?? task.status),
  });
}

export async function createClassPracticeSet(
  profileId: string,
  classId: string,
  input: Omit<CreateExerciseSetInput, "space_id" | "section_id" | "status"> & { status?: ExerciseSetStatus },
) {
  const publishAt = input.publish_at ?? null;
  return createExerciseSet(profileId, {
    ...input,
    space_id: classId,
    section_id: null,
    publish_at: publishAt,
    status: resolveScheduledStatus(publishAt, input.status),
  });
}

export async function updateClassPracticeSet(profileId: string, set: ExerciseSetSummary, input: Partial<UpdateExerciseSetInput>) {
  const publishAt = input.publish_at ?? set.publishAt ?? null;
  return updateExerciseSet(profileId, {
    id: set.id,
    space_id: set.spaceId,
    section_id: null,
    ...input,
    publish_at: publishAt,
    status: resolveScheduledStatus(publishAt, input.status ?? set.status),
  });
}

export async function getClassResourceById(classId: string, resourceId: string) {
  const resource = await findResourceById(resourceId);
  return resource?.spaceId === classId ? resource : null;
}

export async function getClassTaskById(classId: string, taskId: string) {
  const task = await findTaskById(taskId);
  return task?.spaceId === classId ? task : null;
}

export async function getClassPracticeSetById(classId: string, setId: string) {
  const set = await getExerciseSetById(setId);
  return set?.spaceId === classId ? set : null;
}

export function publishNowPatch() {
  return getPublishNowPatch();
}

export function softDeletePatch() {
  return {
    status: "deleted" as const,
    deleted_at: nowInShanghaiIso(),
  };
}
