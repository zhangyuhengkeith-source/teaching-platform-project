import { findProfileByEmail, findProfileById, findProfilesByIds, listProfiles } from "@/repositories/profile-repository";
import type { ProfileSummary } from "@/types/domain";

export async function getProfileByUserId(userId: string): Promise<ProfileSummary | null> {
  return findProfileById(userId);
}

export async function getProfileByEmail(email: string): Promise<ProfileSummary | null> {
  return findProfileByEmail(email);
}

export async function listProfilesByIds(profileIds: string[]): Promise<ProfileSummary[]> {
  return findProfilesByIds(profileIds);
}

export async function listAllProfiles(): Promise<ProfileSummary[]> {
  return listProfiles();
}
