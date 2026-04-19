import type { SupabaseClient } from "@supabase/supabase-js";

import { createSpaceRecord, updateSpaceRecord, upsertClassMembershipRecord } from "@/repositories/space-repository";
import type { AssignStudentToClassInput, CreateSpaceInput, UpdateSpaceInput } from "@/types/api";
import type { Database } from "@/types/database";
import type { SpaceMembershipSummary, SpaceSummary } from "@/types/domain";

export async function createSpace(ownerId: string, input: CreateSpaceInput, client?: SupabaseClient<Database>): Promise<SpaceSummary> {
  return createSpaceRecord(ownerId, input, client);
}

export async function updateSpace(input: UpdateSpaceInput, client?: SupabaseClient<Database>): Promise<SpaceSummary> {
  return updateSpaceRecord(input, client);
}

export async function assignStudentToClass(input: AssignStudentToClassInput): Promise<SpaceMembershipSummary> {
  return upsertClassMembershipRecord(input);
}
