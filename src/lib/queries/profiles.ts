import { mapProfileRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSeedProfileById, seedProfiles } from "@/lib/seed/seed";
import type { ProfileSummary } from "@/types/domain";

export async function getProfileByUserId(userId: string): Promise<ProfileSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getSeedProfileById(userId);
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapProfileRow(data);
}

export async function getProfileByEmail(email: string): Promise<ProfileSummary | null> {
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

export async function listProfilesByIds(profileIds: string[]): Promise<ProfileSummary[]> {
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
