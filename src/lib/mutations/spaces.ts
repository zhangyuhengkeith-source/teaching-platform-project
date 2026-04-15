import { mapSpaceRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AssignStudentToClassInput, CreateSpaceInput, UpdateSpaceInput } from "@/types/api";
import type { SpaceMembershipSummary, SpaceSummary } from "@/types/domain";

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

export async function assignStudentToClass(input: AssignStudentToClassInput): Promise<SpaceMembershipSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      profileId: input.profile_id,
      membershipRole: input.membership_role,
      status: "active",
      joinedAt: new Date().toISOString(),
    };
  }

  const payload = {
    space_id: input.space_id,
    profile_id: input.profile_id,
    membership_role: input.membership_role,
    status: "active" as const,
    joined_at: new Date().toISOString(),
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
