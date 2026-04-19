import { createResourceRecord, updateResourceRecord } from "@/repositories/resource-repository";
import type { CreateResourceInput, UpdateResourceInput } from "@/types/api";
import type { ResourceSummary } from "@/types/domain";

export async function createResource(profileId: string, input: CreateResourceInput): Promise<ResourceSummary> {
  return createResourceRecord(profileId, input);
}

export async function updateResource(profileId: string, input: UpdateResourceInput): Promise<ResourceSummary> {
  return updateResourceRecord(profileId, input);
}
