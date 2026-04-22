import { seedExerciseSets, seedResources, seedSpaces, seedTasks } from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toShanghaiIsoString } from "@/lib/utils/timezone";

type SlugTable = "resources" | "tasks" | "exercise_sets" | "spaces";

interface GenerateUniqueSlugInput {
  moduleName: string;
  className: string | null | undefined;
  table: SlugTable;
  spaceId?: string | null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getShanghaiDateSlugPart(value: Date = new Date()) {
  return toShanghaiIsoString(value).slice(0, 10).replaceAll("-", "");
}

export function normalizeSlugSegment(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export function buildAutoSlugBase(moduleName: string, className: string | null | undefined, value: Date = new Date()) {
  return [
    getShanghaiDateSlugPart(value),
    normalizeSlugSegment(moduleName, "item").toLowerCase(),
    normalizeSlugSegment(className, "class"),
  ].join("-");
}

export function nextSlugFromExisting(baseSlug: string, existingSlugs: string[]) {
  const matcher = new RegExp(`^${escapeRegExp(baseSlug)}-(\\d+)$`);
  const maxSequence = existingSlugs.reduce((max, slug) => {
    const match = slug.match(matcher);
    if (!match) {
      return max;
    }

    const sequence = Number.parseInt(match[1] ?? "0", 10);
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);

  return `${baseSlug}-${String(maxSequence + 1).padStart(2, "0")}`;
}

export async function generateUniqueSpaceContentSlug(input: GenerateUniqueSlugInput) {
  const baseSlug = buildAutoSlugBase(input.moduleName, input.className);
  const existingSlugs = await listExistingSlugs(input.table, baseSlug, input.spaceId ?? null);

  return nextSlugFromExisting(baseSlug, existingSlugs);
}

async function listExistingSlugs(table: SlugTable, baseSlug: string, spaceId: string | null) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (table === "resources") {
      return seedResources.filter((item) => item.spaceId === spaceId && item.slug.startsWith(baseSlug)).map((item) => item.slug);
    }

    if (table === "tasks") {
      return seedTasks.filter((item) => item.spaceId === spaceId && item.slug.startsWith(baseSlug)).map((item) => item.slug);
    }

    if (table === "exercise_sets") {
      return seedExerciseSets.filter((item) => item.spaceId === spaceId && item.slug.startsWith(baseSlug)).map((item) => item.slug);
    }

    return seedSpaces.filter((item) => item.slug.startsWith(baseSlug)).map((item) => item.slug);
  }

  if (table === "resources") {
    let query = supabase.from("resources").select("slug").like("slug", `${baseSlug}-%`);
    if (spaceId) {
      query = query.eq("space_id", spaceId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return data?.map((item) => item.slug) ?? [];
  }

  if (table === "tasks") {
    let query = supabase.from("tasks").select("slug").like("slug", `${baseSlug}-%`);
    if (spaceId) {
      query = query.eq("space_id", spaceId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return data?.map((item) => item.slug) ?? [];
  }

  if (table === "exercise_sets") {
    let query = supabase.from("exercise_sets").select("slug").like("slug", `${baseSlug}-%`);
    if (spaceId) {
      query = query.eq("space_id", spaceId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return data?.map((item) => item.slug) ?? [];
  }

  const { data, error } = await supabase.from("spaces").select("slug").like("slug", `${baseSlug}-%`);
  if (error) {
    throw new Error(error.message);
  }

  return data?.map((item) => item.slug) ?? [];
}
