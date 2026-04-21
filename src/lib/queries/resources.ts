import { canManageResource } from "@/lib/permissions/resources";
import { isAdminRole } from "@/lib/permissions/profiles";
import { listManageableClasses, listMembershipsForSpace } from "@/lib/queries/spaces";
import { isNonArchivedContentStatus } from "@/lib/status/content-status";
import { findResourceById, findResourceBySlugForSpace, listResourcesBySectionId, listResourcesBySpaceId } from "@/repositories/resource-repository";
import type { AppUserProfile } from "@/types/auth";
import type { ResourceSummary } from "@/types/domain";

export async function listResourcesForSpace(spaceId: string): Promise<ResourceSummary[]> {
  return listResourcesBySpaceId(spaceId);
}

export async function listResourcesForSection(sectionId: string): Promise<ResourceSummary[]> {
  return listResourcesBySectionId(sectionId);
}

export async function getResourceBySlugForSpace(spaceId: string, slug: string): Promise<ResourceSummary | null> {
  return findResourceBySlugForSpace(spaceId, slug);
}

export async function getResourceById(resourceId: string): Promise<ResourceSummary | null> {
  return findResourceById(resourceId);
}

export async function listManageableResources(profile: AppUserProfile): Promise<ResourceSummary[]> {
  const spaces = await listManageableClasses(profile);
  const resources = await Promise.all(spaces.map((space) => listResourcesForSpace(space.id)));

  return resources
    .flat()
    .filter((resource) => {
      if (!isAdminRole(profile) && !isNonArchivedContentStatus(resource.status)) {
        return false;
      }

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

  if (!isAdminRole(profile) && !isNonArchivedContentStatus(resource.status)) {
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
