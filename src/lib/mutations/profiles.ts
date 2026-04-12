import { mapProfileRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UpdateProfileInput } from "@/types/api";
import type { AppUserProfile } from "@/types/auth";
import type { ProfileSummary } from "@/types/domain";

export async function createProfileIfMissing(user: AppUserProfile): Promise<ProfileSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
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

  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing) {
    return mapProfileRow(existing);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      display_name: user.displayName ?? null,
      avatar_url: user.avatarUrl ?? null,
      role: user.role,
      user_type: user.userType,
      grade_level: user.gradeLevel ?? null,
      status: user.status ?? "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to bootstrap profile.");
  }

  return mapProfileRow(data);
}

export async function updateProfile(profileId: string, input: UpdateProfileInput): Promise<ProfileSummary> {
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

