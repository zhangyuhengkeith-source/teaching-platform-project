import type { SupabaseClient } from "@supabase/supabase-js";

import { createSpace, assignProfileToSpace, updateSpace } from "@/lib/mutations/spaces";
import { isAdminRole, isTeacher } from "@/lib/permissions/profiles";
import { getSpaceById } from "@/lib/queries/spaces";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type { CreateClassFormSchema } from "@/lib/validations/class-space";
import type { AppUserProfile } from "@/types/auth";
import type { Database } from "@/types/database";
import type { SpaceSummary } from "@/types/domain";

type WriteClient = SupabaseClient<Database>;

async function getWriteClient() {
  return (await createSupabaseServerWriteClient({ requireServiceRole: true })) as WriteClient;
}

function assertCanCreateClass(profile: AppUserProfile) {
  if (!isAdminRole(profile) && !isTeacher(profile)) {
    throw new Error("You do not have permission to create classes.");
  }
}

function assertAdmin(profile: AppUserProfile) {
  if (!isAdminRole(profile)) {
    throw new Error("Only admins can approve or reject class requests.");
  }
}

function assertCanResubmit(profile: AppUserProfile, space: SpaceSummary) {
  if (isAdminRole(profile)) {
    return;
  }

  if ((space.createdBy ?? space.ownerId) !== profile.id) {
    throw new Error("You can only resubmit your own rejected class request.");
  }

  if (space.approvalStatus !== "rejected") {
    throw new Error("Only rejected class requests can be resubmitted.");
  }
}

export async function createClassApprovalRequest(profile: AppUserProfile, input: CreateClassFormSchema & { slug: string }) {
  assertCanCreateClass(profile);

  const client = await getWriteClient();
  const timestamp = nowInShanghaiIso();
  const adminCreating = isAdminRole(profile);
  const space = await createSpace(
    profile.id,
    {
      title: input.title,
      slug: input.slug,
      type: "class",
      description: input.description ?? null,
      academic_year: input.academic_year ?? null,
      status: adminCreating ? "published" : "draft",
      approval_status: adminCreating ? "approved" : "pending",
      submitted_at: timestamp,
      approved_at: adminCreating ? timestamp : null,
      approved_by: adminCreating ? profile.id : null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
    },
    client,
  );

  await assignProfileToSpace(
    {
      profile_id: profile.id,
      space_id: space.id,
      membership_role: "teacher",
    },
    client,
  );

  return space;
}

export async function resubmitRejectedClassRequest(profile: AppUserProfile, input: CreateClassFormSchema & { id: string; slug: string }) {
  const space = await getSpaceById(input.id);
  if (!space || space.type !== "class") {
    throw new Error("Class request not found.");
  }

  assertCanResubmit(profile, space);
  const timestamp = nowInShanghaiIso();
  const client = await getWriteClient();

  return updateSpace(
    {
      id: input.id,
      title: input.title,
      slug: input.slug,
      type: "class",
      description: input.description ?? null,
      academic_year: input.academic_year ?? null,
      status: "draft",
      approval_status: "pending",
      submitted_at: timestamp,
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
    },
    client,
  );
}

export async function approveClassRequest(profile: AppUserProfile, classId: string) {
  assertAdmin(profile);

  const space = await getSpaceById(classId);
  if (!space || space.type !== "class") {
    throw new Error("Class request not found.");
  }

  const timestamp = nowInShanghaiIso();
  const client = await getWriteClient();

  return updateSpace(
    {
      id: classId,
      type: "class",
      status: "published",
      approval_status: "approved",
      approved_at: timestamp,
      approved_by: profile.id,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
    },
    client,
  );
}

export async function rejectClassRequest(profile: AppUserProfile, classId: string, reason?: string | null) {
  assertAdmin(profile);

  const space = await getSpaceById(classId);
  if (!space || space.type !== "class") {
    throw new Error("Class request not found.");
  }

  const timestamp = nowInShanghaiIso();
  const client = await getWriteClient();

  return updateSpace(
    {
      id: classId,
      type: "class",
      status: "draft",
      approval_status: "rejected",
      rejected_at: timestamp,
      rejected_by: profile.id,
      rejection_reason: reason?.trim() || null,
    },
    client,
  );
}
