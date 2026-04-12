import { canManageResource } from "@/lib/permissions/resources";
import { listManageableClasses, listMembershipsForSpace } from "@/lib/queries/spaces";
import { mapResourceFileRow, mapResourceRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seedResources } from "@/lib/seed/seed";
import type { AppUserProfile } from "@/types/auth";
import type { ResourceSummary } from "@/types/domain";

export async function listResourcesForSpace(spaceId: string): Promise<ResourceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.filter((resource) => resource.spaceId === spaceId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("space_id", spaceId).order("sort_order");
  if (error || !data) {
    return [];
  }

  return data.map((row) =>
    mapResourceRow(
      row,
      row.resource_files?.map(mapResourceFileRow),
    ),
  );
}

export async function listResourcesForSection(sectionId: string): Promise<ResourceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.filter((resource) => resource.sectionId === sectionId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("section_id", sectionId).order("sort_order");
  if (error || !data) {
    return [];
  }

  return data.map((row) =>
    mapResourceRow(
      row,
      row.resource_files?.map(mapResourceFileRow),
    ),
  );
}

export async function getResourceBySlugForSpace(spaceId: string, slug: string): Promise<ResourceSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.find((resource) => resource.spaceId === spaceId && resource.slug === slug) ?? null;
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("space_id", spaceId).eq("slug", slug).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapResourceRow(
    data,
    data.resource_files?.map(mapResourceFileRow),
  );
}

export async function getResourceById(resourceId: string): Promise<ResourceSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedResources.find((resource) => resource.id === resourceId) ?? null;
  }

  const { data, error } = await supabase.from("resources").select("*, resource_files(*)").eq("id", resourceId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapResourceRow(
    data,
    data.resource_files?.map(mapResourceFileRow),
  );
}

export async function listManageableResources(profile: AppUserProfile): Promise<ResourceSummary[]> {
  const spaces = await listManageableClasses(profile);
  const resources = await Promise.all(spaces.map((space) => listResourcesForSpace(space.id)));

  return resources
    .flat()
    .filter((resource) => {
      const space = spaces.find((item) => item.id === resource.spaceId);
      return space ? canManageResource(profile, { resource, space }) : false;
    })
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getManageableResourceById(resourceId: string, profile: AppUserProfile): Promise<ResourceSummary | null> {
  const resource = await getResourceById(resourceId);

  if (!resource) {
    return null;
  }

  const spaces = await listManageableClasses(profile);
  const space = spaces.find((item) => item.id === resource.spaceId);

  if (!space) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageResource(profile, { resource, space, memberships })) {
    return null;
  }

  return resource;
}
