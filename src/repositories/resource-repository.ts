import { mapResourceFileRow, mapResourceRow } from "@/lib/db/mappers";
import { seedResources } from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import { removeStoredFiles } from "@/services/storage-server-service";
import type { CreateResourceInput, ResourceFileInput, UpdateResourceInput } from "@/types/api";
import type { ResourceFileSummary, ResourceSummary } from "@/types/domain";

function normalizeFileMetadata(files: CreateResourceInput["file_metadata"]): ResourceFileInput[] {
  return (files ?? []).map((file, index) => ({
    ...file,
    sort_order: file.sort_order ?? index,
    preview_url: file.preview_url ?? null,
    file_ext: file.file_ext ?? null,
    mime_type: file.mime_type ?? null,
    file_size: file.file_size ?? null,
  }));
}

function mapResourceFileInput(file: ResourceFileInput): ResourceFileSummary {
  return {
    id: file.id ?? crypto.randomUUID(),
    filePath: file.file_path,
    fileName: file.file_name,
    fileExt: file.file_ext ?? null,
    mimeType: file.mime_type ?? null,
    fileSize: file.file_size ?? null,
    previewUrl: file.preview_url ?? null,
    sortOrder: file.sort_order ?? 0,
  };
}

function mapResourceWithFiles(row: Parameters<typeof mapResourceRow>[0] & { resource_files?: Parameters<typeof mapResourceFileRow>[0][] | null }) {
  return mapResourceRow(
    row,
    row.resource_files?.map(mapResourceFileRow),
  );
}

async function syncResourceFiles(resourceId: string, files: CreateResourceInput["file_metadata"]): Promise<ResourceFileSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const normalizedFiles = normalizeFileMetadata(files);
    return normalizedFiles.map(mapResourceFileInput);
  }

  const { data: existingFiles, error: existingFilesError } = await supabase
    .from("resource_files")
    .select("*")
    .eq("resource_id", resourceId)
    .order("sort_order");

  if (existingFilesError) {
    throw new Error(existingFilesError.message);
  }

  if (typeof files === "undefined") {
    return (existingFiles ?? []).map(mapResourceFileRow);
  }

  const normalizedFiles = normalizeFileMetadata(files);
  const keepFileIds = new Set(normalizedFiles.flatMap((file) => (file.id ? [file.id] : [])));
  const filesToDelete = (existingFiles ?? []).filter((file) => !keepFileIds.has(file.id));

  if (filesToDelete.length > 0) {
    await removeStoredFiles({ filePaths: filesToDelete.map((file) => file.file_path) });

    const { error: deleteError } = await supabase.from("resource_files").delete().in("id", filesToDelete.map((file) => file.id));
    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  const filesToUpdate = normalizedFiles.filter((file): file is ResourceFileInput & { id: string } => typeof file.id === "string");
  for (const file of filesToUpdate) {
    const { error: updateError } = await supabase
      .from("resource_files")
      .update({
        file_path: file.file_path,
        file_name: file.file_name,
        file_ext: file.file_ext ?? null,
        mime_type: file.mime_type ?? null,
        file_size: file.file_size ?? null,
        preview_url: file.preview_url ?? null,
        sort_order: file.sort_order ?? 0,
      })
      .eq("id", file.id)
      .eq("resource_id", resourceId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  const filesToInsert = normalizedFiles
    .filter((file) => !file.id)
    .map((file) => ({
      resource_id: resourceId,
      file_path: file.file_path,
      file_name: file.file_name,
      file_ext: file.file_ext ?? null,
      mime_type: file.mime_type ?? null,
      file_size: file.file_size ?? null,
      preview_url: file.preview_url ?? null,
      sort_order: file.sort_order ?? 0,
    }));

  if (filesToInsert.length > 0) {
    const { error: insertError } = await supabase.from("resource_files").insert(filesToInsert);
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const { data: syncedFiles, error: syncedFilesError } = await supabase
    .from("resource_files")
    .select("*")
    .eq("resource_id", resourceId)
    .order("sort_order");

  if (syncedFilesError || !syncedFiles) {
    throw new Error(syncedFilesError?.message ?? "Failed to load resource files.");
  }

  return syncedFiles.map(mapResourceFileRow);
}

// Migration seam: keep resource data access and file metadata sync behind a provider-neutral repository.
export async function listResourcesBySpaceId(spaceId: string): Promise<ResourceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.filter((resource) => resource.spaceId === spaceId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("space_id", spaceId).order("sort_order");
  if (error || !data) {
    return [];
  }

  return data.map(mapResourceWithFiles);
}

export async function listResourcesBySectionId(sectionId: string): Promise<ResourceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.filter((resource) => resource.sectionId === sectionId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("section_id", sectionId).order("sort_order");
  if (error || !data) {
    return [];
  }

  return data.map(mapResourceWithFiles);
}

export async function findResourceBySlugForSpace(spaceId: string, slug: string): Promise<ResourceSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.find((resource) => resource.spaceId === spaceId && resource.slug === slug) ?? null;
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("space_id", spaceId).eq("slug", slug).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapResourceWithFiles(data);
}

export async function findResourceById(resourceId: string): Promise<ResourceSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.find((resource) => resource.id === resourceId) ?? null;
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("id", resourceId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapResourceWithFiles(data);
}

export async function createResourceRecord(profileId: string, input: CreateResourceInput): Promise<ResourceSummary> {
  const supabase = await createSupabaseServerClient();
  const normalizedFiles = normalizeFileMetadata(input.file_metadata);

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      sectionId: input.section_id ?? null,
      chapterId: input.chapter_id ?? null,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      resourceType: input.resource_type,
      status: input.status ?? "draft",
      visibility: input.visibility,
      publishedAt: input.publish_at ?? input.published_at ?? null,
      publishAt: input.publish_at ?? input.published_at ?? null,
      sortOrder: input.sort_order ?? 0,
      files: normalizedFiles.map(mapResourceFileInput),
    };
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({
      space_id: input.space_id,
      section_id: input.section_id ?? null,
      chapter_id: input.chapter_id ?? null,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      resource_type: input.resource_type,
      visibility: input.visibility,
      status: input.status ?? "draft",
      published_at: input.publish_at ?? input.published_at ?? null,
      publish_at: input.publish_at ?? input.published_at ?? null,
      sort_order: input.sort_order ?? 0,
      created_by: profileId,
      updated_by: profileId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create resource.");
  }

  try {
    const files = await syncResourceFiles(data.id, normalizedFiles);
    return mapResourceRow(data, files);
  } catch (syncError) {
    await supabase.from("resources").delete().eq("id", data.id);
    throw syncError;
  }
}

export async function updateResourceRecord(profileId: string, input: UpdateResourceInput): Promise<ResourceSummary> {
  const supabase = await createSupabaseServerClient();
  const normalizedFiles = typeof input.file_metadata === "undefined" ? undefined : normalizeFileMetadata(input.file_metadata);

  if (!supabase) {
    return {
      id: input.id,
      spaceId: input.space_id ?? "mock-space",
      sectionId: input.section_id ?? null,
      chapterId: input.chapter_id ?? null,
      title: input.title ?? "Untitled Resource",
      slug: input.slug ?? "untitled-resource",
      description: input.description ?? null,
      resourceType: input.resource_type ?? "other",
      status: input.status ?? "draft",
      visibility: input.visibility ?? "space",
      publishedAt: input.publish_at ?? input.published_at ?? null,
      publishAt: input.publish_at ?? input.published_at ?? null,
      sortOrder: input.sort_order ?? 0,
      files: normalizedFiles?.map(mapResourceFileInput),
    };
  }

  const { data, error } = await supabase
    .from("resources")
    .update({
      space_id: input.space_id,
      section_id: input.section_id,
      chapter_id: input.chapter_id,
      title: input.title,
      slug: input.slug,
      description: input.description,
      resource_type: input.resource_type,
      visibility: input.visibility,
      status: input.status,
      archived_at: input.status === "archived" ? nowInShanghaiIso() : undefined,
      deleted_at: input.status === "deleted" ? nowInShanghaiIso() : undefined,
      published_at: input.publish_at ?? input.published_at,
      publish_at: input.publish_at ?? input.published_at,
      sort_order: input.sort_order,
      updated_by: profileId,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update resource.");
  }

  const files = await syncResourceFiles(data.id, normalizedFiles);
  return mapResourceRow(data, files);
}
