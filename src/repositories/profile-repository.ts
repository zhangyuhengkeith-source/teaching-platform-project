import { mapProfileRow } from "@/lib/db/mappers";
import { getSeedProfileById, seedProfiles } from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UpdateProfileAccessInput, UpdateProfileInput } from "@/types/api";
import type { AppUserProfile } from "@/types/auth";
import type { ProfileSummary } from "@/types/domain";

function buildMockProfile(user: AppUserProfile): ProfileSummary {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    userType: user.userType,
    gradeLevel: user.gradeLevel ?? null,
    status: user.status ?? "active",
  };
}

// Migration seam: keep profile data access behind a provider-neutral repository.
export async function findProfileById(profileId: string): Promise<ProfileSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getSeedProfileById(profileId);
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileRow(data);
}

export async function findProfileByEmail(email: string): Promise<ProfileSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedProfiles.find((profile) => profile.email === email) ?? null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileRow(data);
}

export async function findProfilesByIds(profileIds: string[]): Promise<ProfileSummary[]> {
  if (profileIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedProfiles.filter((profile) => profileIds.includes(profile.id));
  }

  const { data, error } = await supabase.from("profiles").select("*").in("id", profileIds);

  if (error || !data) {
    return [];
  }

  return data.map(mapProfileRow);
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [...seedProfiles].sort((left, right) => left.fullName.localeCompare(right.fullName));
  }

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapProfileRow);
}

export async function ensureProfile(profile: AppUserProfile): Promise<ProfileSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return buildMockProfile(profile);
  }

  const { data: existing } = await supabase.from("profiles").select("*").eq("id", profile.id).maybeSingle();

  if (existing) {
    return mapProfileRow(existing);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName,
      display_name: profile.displayName ?? null,
      avatar_url: profile.avatarUrl ?? null,
      role: profile.role,
      user_type: profile.userType,
      grade_level: profile.gradeLevel ?? null,
      status: profile.status ?? "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to bootstrap profile.");
  }

  return mapProfileRow(data);
}

export async function updateProfileDetails(profileId: string, input: UpdateProfileInput): Promise<ProfileSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: profileId,
      email: "mock@local.dev",
      fullName: input.full_name,
      displayName: input.display_name ?? null,
      avatarUrl: input.avatar_url ?? null,
      role: "student",
      userType: "internal",
      gradeLevel: input.grade_level ?? null,
      status: "active",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      display_name: input.display_name ?? null,
      grade_level: input.grade_level ?? null,
      avatar_url: input.avatar_url ?? null,
    })
    .eq("id", profileId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update profile.");
  }

  return mapProfileRow(data);
}

export async function updateProfileAccessLevel(input: UpdateProfileAccessInput): Promise<ProfileSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      id: input.id,
      email: "mock@local.dev",
      fullName: "Mock User",
      displayName: null,
      avatarUrl: null,
      role: input.role,
      userType: input.user_type,
      gradeLevel: null,
      status: input.status,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: input.role,
      user_type: input.user_type,
      status: input.status,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update profile access.");
  }

  return mapProfileRow(data);
}
