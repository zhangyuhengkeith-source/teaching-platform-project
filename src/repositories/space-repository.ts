import type { SupabaseClient } from "@supabase/supabase-js";

import { mapSpaceMembershipRow, mapSpaceRow, mapSpaceSectionRow } from "@/lib/db/mappers";
import { seedMemberships, seedSections, seedSpaces } from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type { AssignProfileToSpaceInput, AssignStudentToClassInput, CreateSpaceInput, UpdateSpaceInput } from "@/types/api";
import type { Database } from "@/types/database";
import type { SpaceMembershipSummary, SpaceSectionSummary, SpaceSummary } from "@/types/domain";

type SpaceRepositoryClient = SupabaseClient<Database>;

async function ensureUniqueClassSlug(baseSlug: string, excludeId?: string, client?: SpaceRepositoryClient): Promise<string> {
  const supabase = client ?? (await createSupabaseServerClient());

  if (!supabase) {
    return baseSlug;
  }

  let query = supabase.from("spaces").select("id, slug").eq("type", "class").like("slug", `${baseSlug}%`);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return baseSlug;
  }

  const existingSlugs = new Set(data.map((item) => item.slug));
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let candidate = `${baseSlug}-${counter}`;
  while (existingSlugs.has(candidate)) {
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  return candidate;
}

export async function listMembershipsByProfileId(profileId: string): Promise<SpaceMembershipSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedMemberships.filter((membership) => membership.profileId === profileId);
  }

  const { data, error } = await supabase.from("space_memberships").select("*").eq("profile_id", profileId);
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceMembershipRow);
}

// Migration seam: keep base space/member/section data access behind a provider-neutral repository.
export async function listSpacesByProfileId(profileId: string): Promise<SpaceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const memberships = seedMemberships.filter((membership) => membership.profileId === profileId && membership.status === "active");
    const visibleSpaceIds = new Set([...memberships.map((membership) => membership.spaceId), ...seedSpaces.filter((space) => space.ownerId === profileId).map((space) => space.id)]);
    return seedSpaces.filter((space) => visibleSpaceIds.has(space.id));
  }

  const memberships = await listMembershipsByProfileId(profileId);
  const membershipSpaceIds = memberships.filter((membership) => membership.status === "active").map((membership) => membership.spaceId);

  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .or(`owner_id.eq.${profileId},id.in.(${membershipSpaceIds.length > 0 ? membershipSpaceIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);

  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceRow);
}

export async function listSectionsBySpaceId(spaceId: string): Promise<SpaceSectionSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSections.filter((section) => section.spaceId === spaceId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase.from("space_sections").select("*").eq("space_id", spaceId).order("sort_order");
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceSectionRow);
}

export async function listMembershipsBySpaceId(spaceId: string): Promise<SpaceMembershipSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedMemberships.filter((membership) => membership.spaceId === spaceId);
  }

  const { data, error } = await supabase.from("space_memberships").select("*").eq("space_id", spaceId);
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceMembershipRow);
}

export async function findSpaceById(spaceId: string): Promise<SpaceSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSpaces.find((space) => space.id === spaceId) ?? null;
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("id", spaceId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapSpaceRow(data);
}

export async function findSpaceBySlug(slug: string): Promise<SpaceSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSpaces.find((space) => space.slug === slug) ?? null;
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapSpaceRow(data);
}

export async function findSectionBySlugForSpaceId(spaceId: string, sectionSlug: string): Promise<SpaceSectionSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSections.find((section) => section.spaceId === spaceId && section.slug === sectionSlug) ?? null;
  }

  const { data, error } = await supabase.from("space_sections").select("*").eq("space_id", spaceId).eq("slug", sectionSlug).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapSpaceSectionRow(data);
}

export async function listClassSpaces(): Promise<SpaceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSpaces.filter((space) => space.type === "class");
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("type", "class").order("created_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceRow);
}

export async function listElectiveSpaces(): Promise<SpaceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSpaces.filter((space) => space.type === "elective");
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("type", "elective").order("created_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceRow);
}

export async function profileHasActiveClassMembership(profileId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedMemberships.some((membership) => {
      if (membership.profileId !== profileId || membership.status !== "active" || membership.membershipRole !== "student") {
        return false;
      }

      const space = seedSpaces.find((entry) => entry.id === membership.spaceId);
      return space?.type === "class";
    });
  }

  const { data, error } = await supabase
    .from("space_memberships")
    .select("space_id, spaces!inner(type)")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .eq("membership_role", "student")
    .eq("spaces.type", "class")
    .limit(1);

  if (error) {
    return false;
  }

  return Boolean(data && data.length > 0);
}

export async function createSpaceRecord(ownerId: string, input: CreateSpaceInput, client?: SpaceRepositoryClient): Promise<SpaceSummary> {
  const supabase = client ?? (await createSupabaseServerClient());
  const slug = input.type === "class" ? await ensureUniqueClassSlug(input.slug, undefined, supabase ?? undefined) : input.slug;

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      ownerId,
      createdBy: ownerId,
      approvalStatus: input.approval_status ?? "approved",
      submittedAt: input.submitted_at ?? null,
      approvedAt: input.approved_at ?? null,
      approvedBy: input.approved_by ?? null,
      rejectedAt: input.rejected_at ?? null,
      rejectedBy: input.rejected_by ?? null,
      rejectionReason: input.rejection_reason ?? null,
      title: input.title,
      slug,
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
      created_by: ownerId,
      title: input.title,
      slug,
      type: input.type,
      description: input.description ?? null,
      academic_year: input.academic_year ?? null,
      status: input.status ?? "draft",
      approval_status: input.approval_status ?? "approved",
      submitted_at: input.submitted_at ?? null,
      approved_at: input.approved_at ?? null,
      approved_by: input.approved_by ?? null,
      rejected_at: input.rejected_at ?? null,
      rejected_by: input.rejected_by ?? null,
      rejection_reason: input.rejection_reason ?? null,
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

export async function updateSpaceRecord(input: UpdateSpaceInput, client?: SpaceRepositoryClient): Promise<SpaceSummary> {
  const supabase = client ?? (await createSupabaseServerClient());
  const slug = input.type === "class" && input.slug ? await ensureUniqueClassSlug(input.slug, input.id, supabase ?? undefined) : input.slug;

  if (!supabase) {
    return {
      id: input.id,
      ownerId: "mock-owner",
      createdBy: "mock-owner",
      approvalStatus: input.approval_status ?? "approved",
      submittedAt: input.submitted_at ?? null,
      approvedAt: input.approved_at ?? null,
      approvedBy: input.approved_by ?? null,
      rejectedAt: input.rejected_at ?? null,
      rejectedBy: input.rejected_by ?? null,
      rejectionReason: input.rejection_reason ?? null,
      title: input.title ?? "Untitled Space",
      slug: slug ?? "untitled-space",
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
      slug,
      type: input.type,
      description: input.description,
      academic_year: input.academic_year,
      status: input.status,
      approval_status: input.approval_status,
      submitted_at: input.submitted_at,
      approved_at: input.approved_at,
      approved_by: input.approved_by,
      rejected_at: input.rejected_at,
      rejected_by: input.rejected_by,
      rejection_reason: input.rejection_reason,
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

export async function upsertSpaceMembershipRecord(input: AssignProfileToSpaceInput, client?: SpaceRepositoryClient): Promise<SpaceMembershipSummary> {
  const supabase = client ?? (await createSupabaseServerClient());

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      profileId: input.profile_id,
      membershipRole: input.membership_role,
      status: "active",
    joinedAt: nowInShanghaiIso(),
    };
  }

  const payload = {
    space_id: input.space_id,
    profile_id: input.profile_id,
    membership_role: input.membership_role,
    status: "active" as const,
    joined_at: nowInShanghaiIso(),
  };

  const { data, error } = await supabase
    .from("space_memberships")
    .upsert(payload, { onConflict: "space_id,profile_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to assign user to class.");
  }

  return {
    id: data.id,
    spaceId: data.space_id,
    profileId: data.profile_id,
    membershipRole: data.membership_role,
    status: data.status,
    joinedAt: data.joined_at,
  };
}

export async function upsertClassMembershipRecord(input: AssignStudentToClassInput, client?: SpaceRepositoryClient): Promise<SpaceMembershipSummary> {
  return upsertSpaceMembershipRecord(input, client);
}
