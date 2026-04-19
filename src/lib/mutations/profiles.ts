import { ensureProfile, updateProfileAccessLevel, updateProfileDetails } from "@/repositories/profile-repository";
import type { UpdateProfileAccessInput, UpdateProfileInput } from "@/types/api";
import type { AppUserProfile } from "@/types/auth";
import type { ProfileSummary } from "@/types/domain";

export async function createProfileIfMissing(user: AppUserProfile): Promise<ProfileSummary> {
  return ensureProfile(user);
}

export async function updateProfile(profileId: string, input: UpdateProfileInput): Promise<ProfileSummary> {
  return updateProfileDetails(profileId, input);
}

export async function updateProfileAccess(input: UpdateProfileAccessInput): Promise<ProfileSummary> {
  return updateProfileAccessLevel(input);
}
