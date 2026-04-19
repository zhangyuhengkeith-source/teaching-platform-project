import { createSpaceRecord, updateSpaceRecord, upsertClassMembershipRecord } from "@/repositories/space-repository";
import type { AssignStudentToClassInput, CreateSpaceInput, UpdateSpaceInput } from "@/types/api";
import type { SpaceMembershipSummary, SpaceSummary } from "@/types/domain";

export async function createSpace(ownerId: string, input: CreateSpaceInput): Promise<SpaceSummary> {
  return createSpaceRecord(ownerId, input);
}

export async function updateSpace(input: UpdateSpaceInput): Promise<SpaceSummary> {
  return updateSpaceRecord(input);
}

export async function assignStudentToClass(input: AssignStudentToClassInput): Promise<SpaceMembershipSummary> {
  return upsertClassMembershipRecord(input);
}
