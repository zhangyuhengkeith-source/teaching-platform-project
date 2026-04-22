import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapCourseChapterItemRow,
  mapCourseChapterSetRow,
  mapCourseChapterTemplateRow,
} from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type {
  CourseChapterItemInput,
  CreateCourseChapterSetInput,
  ImportCourseChapterTemplateInput,
  SaveCourseChapterTemplateInput,
  UpdateCourseChapterSetInput,
} from "@/types/api";
import type { Database, Json } from "@/types/database";
import type {
  CourseChapterItemSummary,
  CourseChapterLevel,
  CourseChapterSetSummary,
  CourseChapterTemplateItem,
  CourseChapterTemplateSummary,
} from "@/types/domain";

type CourseChapterClient = SupabaseClient<Database>;

const demoChapterSets: CourseChapterSetSummary[] = [];
const demoTemplates: CourseChapterTemplateSummary[] = [];

function getSupabaseErrorMessage(error: { code?: string; message: string } | null | undefined) {
  if (!error) {
    return "Course chapter operation failed.";
  }

  if (error.code === "23505") {
    return "Course main title and subtitle must be unique within this class.";
  }

  return error.message;
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeChapterItems(items: CourseChapterItemInput[] | undefined): CourseChapterItemInput[] {
  const normalized = (items ?? []).map((item, index) => ({
    ...item,
    id: item.id ?? crypto.randomUUID(),
    parent_id: item.parent_id ?? null,
    description: normalizeNullableText(item.description),
    sort_order: item.sort_order ?? index,
  }));
  const itemById = new Map(normalized.map((item) => [item.id, item]));

  for (const item of normalized) {
    if (item.level === 1) {
      if (item.parent_id) {
        throw new Error("Level 1 chapters cannot have a parent.");
      }
      continue;
    }

    if (!item.parent_id) {
      throw new Error("Level 2-4 chapters must have a parent.");
    }

    const parent = itemById.get(item.parent_id);
    if (!parent) {
      throw new Error("Chapter parent must exist in the same outline.");
    }

    if (parent.level !== ((item.level - 1) as CourseChapterLevel)) {
      throw new Error("Chapter parent level must be exactly one level above the child.");
    }
  }

  return normalized;
}

function groupItemsBySetId(items: CourseChapterItemSummary[]) {
  const grouped = new Map<string, CourseChapterItemSummary[]>();

  for (const item of items) {
    const current = grouped.get(item.chapterSetId) ?? [];
    current.push(item);
    grouped.set(item.chapterSetId, current);
  }

  for (const group of grouped.values()) {
    group.sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }

  return grouped;
}

async function insertChapterItems(client: CourseChapterClient, chapterSetId: string, items: CourseChapterItemInput[]) {
  const normalizedItems = normalizeChapterItems(items);

  if (normalizedItems.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("course_chapter_items")
    .insert(
      normalizedItems.map((item) => ({
        id: item.id,
        chapter_set_id: chapterSetId,
        parent_id: item.parent_id,
        level: item.level,
        title: item.title,
        description: normalizeNullableText(item.description),
        sort_order: item.sort_order ?? 0,
      })),
    )
    .select("*");

  if (error || !data) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return data.map(mapCourseChapterItemRow);
}

function toTemplateItems(items: CourseChapterItemSummary[]): CourseChapterTemplateItem[] {
  return items
    .slice()
    .sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
    .map((item) => ({
      id: item.id,
      parentId: item.parentId,
      level: item.level,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
    }));
}

function templateItemsToChapterInput(items: CourseChapterTemplateItem[]): CourseChapterItemInput[] {
  const idMap = new Map(items.map((item) => [item.id, crypto.randomUUID()]));

  return items.map((item, index) => ({
    id: idMap.get(item.id),
    parent_id: item.parentId ? idMap.get(item.parentId) ?? null : null,
    level: item.level,
    title: item.title,
    description: item.description,
    sort_order: item.sortOrder ?? index,
  }));
}

export async function listCourseChapterSetsByClassId(classId: string, options: { includeArchived?: boolean } = {}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoChapterSets.filter((set) => {
      if (set.classId !== classId || set.status === "deleted") {
        return false;
      }

      return options.includeArchived || set.status !== "archived";
    });
  }

  let query = supabase
    .from("course_chapter_sets")
    .select("*")
    .eq("class_id", classId)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data: setRows, error } = await query;
  if (error || !setRows) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  const setIds = setRows.map((set) => set.id);
  if (setIds.length === 0) {
    return [];
  }

  const { data: itemRows, error: itemError } = await supabase
    .from("course_chapter_items")
    .select("*")
    .in("chapter_set_id", setIds)
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true });

  if (itemError || !itemRows) {
    throw new Error(getSupabaseErrorMessage(itemError));
  }

  const itemsBySetId = groupItemsBySetId(itemRows.map(mapCourseChapterItemRow));
  return setRows.map((set) => mapCourseChapterSetRow(set, itemsBySetId.get(set.id) ?? []));
}

export async function getCourseChapterSetById(chapterSetId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoChapterSets.find((set) => set.id === chapterSetId) ?? null;
  }

  const { data: setRow, error } = await supabase
    .from("course_chapter_sets")
    .select("*")
    .eq("id", chapterSetId)
    .maybeSingle();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  if (!setRow) {
    return null;
  }

  const { data: itemRows, error: itemError } = await supabase
    .from("course_chapter_items")
    .select("*")
    .eq("chapter_set_id", chapterSetId)
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true });

  if (itemError || !itemRows) {
    throw new Error(getSupabaseErrorMessage(itemError));
  }

  return mapCourseChapterSetRow(setRow, itemRows.map(mapCourseChapterItemRow));
}

export async function createCourseChapterSet(createdBy: string, input: CreateCourseChapterSetInput) {
  const supabase = await createSupabaseServerWriteClient();
  const timestamp = nowInShanghaiIso();

  if (!supabase) {
    const chapterSet: CourseChapterSetSummary = {
      id: crypto.randomUUID(),
      classId: input.class_id,
      mainTitle: input.main_title.trim(),
      subtitle: normalizeNullableText(input.subtitle),
      status: input.status ?? "published",
      createdBy,
      updatedBy: null,
      archivedAt: null,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      items: normalizeChapterItems(input.items).map((item) => ({
        id: item.id!,
        chapterSetId: "",
        parentId: item.parent_id ?? null,
        level: item.level,
        title: item.title,
        description: normalizeNullableText(item.description),
        sortOrder: item.sort_order ?? 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    };
    chapterSet.items = chapterSet.items.map((item) => ({ ...item, chapterSetId: chapterSet.id }));
    demoChapterSets.unshift(chapterSet);
    return chapterSet;
  }

  const { data, error } = await supabase
    .from("course_chapter_sets")
    .insert({
      class_id: input.class_id,
      main_title: input.main_title.trim(),
      subtitle: normalizeNullableText(input.subtitle),
      status: input.status ?? "published",
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  const items = await insertChapterItems(supabase, data.id, input.items ?? []);
  return mapCourseChapterSetRow(data, items);
}

export async function updateCourseChapterSet(updatedBy: string, input: UpdateCourseChapterSetInput) {
  const supabase = await createSupabaseServerWriteClient();

  if (!supabase) {
    const existingIndex = demoChapterSets.findIndex((set) => set.id === input.id);
    if (existingIndex < 0) {
      throw new Error("Course chapter set not found.");
    }

    const existing = demoChapterSets[existingIndex];
    const timestamp = nowInShanghaiIso();
    const nextItems = input.items
      ? normalizeChapterItems(input.items).map((item) => ({
          id: item.id!,
          chapterSetId: existing.id,
          parentId: item.parent_id ?? null,
          level: item.level,
          title: item.title,
          description: normalizeNullableText(item.description),
          sortOrder: item.sort_order ?? 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        }))
      : existing.items;

    const updated = {
      ...existing,
      mainTitle: input.main_title?.trim() ?? existing.mainTitle,
      subtitle: input.subtitle === undefined ? existing.subtitle : normalizeNullableText(input.subtitle),
      status: input.status ?? existing.status,
      updatedBy,
      updatedAt: timestamp,
      items: nextItems,
    };
    demoChapterSets[existingIndex] = updated;
    return updated;
  }

  const patch: Database["public"]["Tables"]["course_chapter_sets"]["Update"] = {
    updated_by: updatedBy,
  };

  if (input.main_title !== undefined) {
    patch.main_title = input.main_title.trim();
  }

  if (input.subtitle !== undefined) {
    patch.subtitle = normalizeNullableText(input.subtitle);
  }

  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "archived") {
      patch.archived_at = nowInShanghaiIso();
    }
    if (input.status === "deleted") {
      patch.deleted_at = nowInShanghaiIso();
    }
  }

  const { data, error } = await supabase
    .from("course_chapter_sets")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  if (input.items) {
    const { error: deleteError } = await supabase.from("course_chapter_items").delete().eq("chapter_set_id", input.id);
    if (deleteError) {
      throw new Error(getSupabaseErrorMessage(deleteError));
    }
    const items = await insertChapterItems(supabase, input.id, input.items);
    return mapCourseChapterSetRow(data, items);
  }

  return (await getCourseChapterSetById(input.id)) ?? mapCourseChapterSetRow(data);
}

export async function deleteCourseChapterSet(deletedBy: string, chapterSetId: string) {
  return updateCourseChapterSet(deletedBy, {
    id: chapterSetId,
    status: "deleted",
  });
}

export async function listCourseChapterTemplates() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoTemplates.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const { data, error } = await supabase
    .from("course_chapter_templates")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return data.map(mapCourseChapterTemplateRow);
}

export async function saveCourseChapterSetAsTemplate(createdBy: string, input: SaveCourseChapterTemplateInput) {
  const chapterSet = await getCourseChapterSetById(input.chapter_set_id);

  if (!chapterSet || chapterSet.status === "deleted") {
    throw new Error("Course chapter set not found.");
  }

  const items = toTemplateItems(chapterSet.items);
  if (items.length === 0) {
    throw new Error("Add at least one chapter item before saving a template.");
  }
  const timestamp = nowInShanghaiIso();
  const supabase = await createSupabaseServerWriteClient();

  if (!supabase) {
    const template: CourseChapterTemplateSummary = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: normalizeNullableText(input.description),
      visibility: input.visibility,
      sourceClassId: chapterSet.classId,
      sourceChapterSetId: chapterSet.id,
      mainTitle: chapterSet.mainTitle,
      subtitle: chapterSet.subtitle,
      items,
      createdBy,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    demoTemplates.unshift(template);
    return template;
  }

  const { data, error } = await supabase
    .from("course_chapter_templates")
    .insert({
      name: input.name.trim(),
      description: normalizeNullableText(input.description),
      visibility: input.visibility,
      source_class_id: chapterSet.classId,
      source_chapter_set_id: chapterSet.id,
      main_title: chapterSet.mainTitle,
      subtitle: chapterSet.subtitle,
      items_json: items as unknown as Json,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return mapCourseChapterTemplateRow(data);
}

export async function importCourseChapterTemplate(createdBy: string, classId: string, input: ImportCourseChapterTemplateInput) {
  const templates = await listCourseChapterTemplates();
  const template = templates.find((entry) => entry.id === input.template_id);

  if (!template) {
    throw new Error("Template not found.");
  }

  return createCourseChapterSet(createdBy, {
    class_id: classId,
    main_title: normalizeNullableText(input.main_title) ?? template.mainTitle,
    subtitle: input.subtitle === undefined ? template.subtitle : normalizeNullableText(input.subtitle),
    status: "published",
    items: templateItemsToChapterInput(template.items),
  });
}

export async function deleteCourseChapterTemplate(templateId: string) {
  const supabase = await createSupabaseServerWriteClient();

  if (!supabase) {
    const index = demoTemplates.findIndex((template) => template.id === templateId);
    if (index >= 0) {
      demoTemplates.splice(index, 1);
    }
    return;
  }

  const { error } = await supabase.from("course_chapter_templates").delete().eq("id", templateId);
  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }
}
