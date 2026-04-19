import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";
import { isTeacher } from "@/lib/permissions/profiles";
import {
  findSectionBySlugForSpaceId,
  findSpaceById,
  findSpaceBySlug,
  listClassSpaces,
  listMembershipsBySpaceId,
  listSectionsBySpaceId,
  listSpacesByProfileId,
  profileHasActiveClassMembership,
} from "@/repositories/space-repository";
import type { AppUserProfile } from "@/types/auth";
import type { SpaceDetail, SpaceMembershipSummary, SpaceSectionSummary, SpaceSummary } from "@/types/domain";

export async function listSpacesForUser(profileId: string): Promise<SpaceSummary[]> {
  return listSpacesByProfileId(profileId);
}

export async function listClassSpacesForUser(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const spaces = await listSpacesForUser(profile.id);
  return spaces.filter((space) => space.type === "class");
}

export async function getSpaceBySlugForUser(slug: string, profileId: string): Promise<SpaceDetail | null> {
  const space = await findSpaceBySlug(slug);

  if (!space) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  const canSeeSpace = memberships.some((membership) => membership.profileId === profileId && membership.status === "active") || space.ownerId === profileId;

  if (!canSeeSpace) {
    return null;
  }

  const sections = await listSectionsForSpace(space.id);
  return { ...space, memberships, sections };
}

export async function getClassSpaceBySlugForUser(slug: string, profile: AppUserProfile): Promise<SpaceDetail | null> {
  const space = await getSpaceBySlugForUser(slug, profile.id);

  if (!space || space.type !== "class") {
    return null;
  }

  if (!canViewSpace(profile, { space, memberships: space.memberships })) {
    return null;
  }

  return space;
}

export async function listSectionsForSpace(spaceId: string): Promise<SpaceSectionSummary[]> {
  return listSectionsBySpaceId(spaceId);
}

export async function listMembershipsForSpace(spaceId: string): Promise<SpaceMembershipSummary[]> {
  return listMembershipsBySpaceId(spaceId);
}

export async function getSpaceById(spaceId: string): Promise<SpaceSummary | null> {
  return findSpaceById(spaceId);
}

export async function getSectionBySlugForSpace(spaceId: string, sectionSlug: string): Promise<SpaceSectionSummary | null> {
  return findSectionBySlugForSpaceId(spaceId, sectionSlug);
}

export async function listManageableClasses(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const spaces = await listSpacesForUser(profile.id);
  const checks = await Promise.all(
    spaces
      .filter((space) => space.type === "class")
      .map(async (space) => ({
        space,
        memberships: await listMembershipsForSpace(space.id),
      })),
  );

  return checks.filter(({ space, memberships }) => canManageSpace(profile, { space, memberships })).map(({ space }) => space);
}

export async function getManageableClassById(classId: string, profile: AppUserProfile): Promise<SpaceSummary | null> {
  const space = await getSpaceById(classId);

  if (!space || space.type !== "class") {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    return null;
  }

  return space;
}

export async function listTeacherVisibleClasses(profile: AppUserProfile): Promise<SpaceSummary[]> {
  if (!isTeacher(profile)) {
    return [];
  }

  return listManageableClasses(profile);
}

export async function listAllClassSpaces(): Promise<SpaceSummary[]> {
  return listClassSpaces();
}

export async function hasActiveClassMembership(profileId: string): Promise<boolean> {
  return profileHasActiveClassMembership(profileId);
}
