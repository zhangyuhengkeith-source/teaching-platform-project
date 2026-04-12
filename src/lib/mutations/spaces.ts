import { mapSpaceRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateSpaceInput, UpdateSpaceInput } from "@/types/api";
import type { SpaceSummary } from "@/types/domain";

export async function createSpace(ownerId: string, input: CreateSpaceInput): Promise<SpaceSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      ownerId,
      title: input.title,
      slug: input.slug,
      type: input.type,
      description: input.description ?? null,
      academicYear: input.academic_year ?? null,
      status: input.status ?? "draft",
      groupingLocked: input.grouping_locked ?? false,
      maxGroupSize: input.max_group_size ?? 4,
    };
  }

  const { data, error } = await supabase
    .from("spaces")
    .insert({
      owner_id: ownerId,
      title: input.title,
      slug: input.slug,
      type: input.type,
      description: input.description ?? null,
      academic_year: input.academic_year ?? null,
      status: input.status ?? "draft",
      grouping_locked: input.grouping_locked ?? false,
      max_group_size: input.max_group_size ?? 4,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create space.");
  }

  return mapSpaceRow(data);
}

export async function updateSpace(input: UpdateSpaceInput): Promise<SpaceSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: input.id,
      ownerId: "mock-owner",
      title: input.title ?? "Untitled Space",
      slug: input.slug ?? "untitled-space",
      type: input.type ?? "class",
      description: input.description ?? null,
      academicYear: input.academic_year ?? null,
      status: input.status ?? "draft",
      groupingLocked: input.grouping_locked ?? false,
      maxGroupSize: input.max_group_size ?? 4,
    };
  }

  const { data, error } = await supabase
    .from("spaces")
    .update({
      title: input.title,
      slug: input.slug,
      type: input.type,
      description: input.description,
      academic_year: input.academic_year,
      status: input.status,
      grouping_locked: input.grouping_locked,
      max_group_size: input.max_group_size,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update space.");
  }

  return mapSpaceRow(data);
}
