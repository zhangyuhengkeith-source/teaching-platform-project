import { mapResourceRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateResourceInput, UpdateResourceInput } from "@/types/api";
import type { ResourceSummary } from "@/types/domain";

export async function createResource(profileId: string, input: CreateResourceInput): Promise<ResourceSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      sectionId: input.section_id ?? null,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      resourceType: input.resource_type,
      status: input.status ?? "draft",
      visibility: input.visibility,
      publishedAt: input.published_at ?? null,
      sortOrder: input.sort_order ?? 0,
      files: [],
    };
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({
      space_id: input.space_id,
      section_id: input.section_id ?? null,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      resource_type: input.resource_type,
      visibility: input.visibility,
      status: input.status ?? "draft",
      published_at: input.published_at ?? null,
      sort_order: input.sort_order ?? 0,
      created_by: profileId,
      updated_by: profileId,
    })
    .select("*, resource_files(*)")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create resource.");
  }

  return mapResourceRow(data, data.resource_files?.map((file) => ({
    id: file.id,
    filePath: file.file_path,
    fileName: file.file_name,
    fileExt: file.file_ext,
    mimeType: file.mime_type,
    fileSize: file.file_size,
    previewUrl: file.preview_url,
    sortOrder: file.sort_order,
  })));
}

export async function updateResource(profileId: string, input: UpdateResourceInput): Promise<ResourceSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: input.id,
      spaceId: input.space_id ?? "mock-space",
      sectionId: input.section_id ?? null,
      title: input.title ?? "Untitled Resource",
      slug: input.slug ?? "untitled-resource",
      description: input.description ?? null,
      resourceType: input.resource_type ?? "other",
      status: input.status ?? "draft",
      visibility: input.visibility ?? "space",
      publishedAt: input.published_at ?? null,
      sortOrder: input.sort_order ?? 0,
      files: [],
    };
  }

  const { data, error } = await supabase
    .from("resources")
    .update({
      space_id: input.space_id,
      section_id: input.section_id,
      title: input.title,
      slug: input.slug,
      description: input.description,
      resource_type: input.resource_type,
      visibility: input.visibility,
      status: input.status,
      published_at: input.published_at,
      sort_order: input.sort_order,
      updated_by: profileId,
    })
    .eq("id", input.id)
    .select("*, resource_files(*)")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update resource.");
  }

  return mapResourceRow(data, data.resource_files?.map((file) => ({
    id: file.id,
    filePath: file.file_path,
    fileName: file.file_name,
    fileExt: file.file_ext,
    mimeType: file.mime_type,
    fileSize: file.file_size,
    previewUrl: file.preview_url,
    sortOrder: file.sort_order,
  })));
}

