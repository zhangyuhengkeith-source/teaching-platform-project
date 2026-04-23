import type { SupabaseClient } from "@supabase/supabase-js";

import { mapClassUpdateRequestRow } from "@/lib/db/mappers";
import { createSpace, assignProfileToSpace, updateSpace } from "@/lib/mutations/spaces";
import { isAdminRole, isTeacher } from "@/lib/permissions/profiles";
import { getSpaceById } from "@/lib/queries/spaces";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type { CreateClassFormSchema } from "@/lib/validations/class-space";
import type { UpdateSpaceSchema } from "@/lib/validations/spaces";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";
import type { AppUserProfile } from "@/types/auth";
import type { Database } from "@/types/database";
import type { ClassUpdateRequestSummary, SpaceSummary } from "@/types/domain";

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

function assertSuperAdmin(profile: AppUserProfile) {
  if (profile.role !== "super_admin") {
    throw new Error("Only super admins can approve or reject class changes.");
  }
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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

export async function submitClassUpdateRequest(profile: AppUserProfile, input: UpdateSpaceSchema): Promise<ClassUpdateRequestSummary> {
  if (!isTeacher(profile) || isAdminRole(profile)) {
    throw new Error("Only teachers need approval for class edits.");
  }

  const space = await getSpaceById(input.id);
  if (!space || space.type !== "class") {
    throw new Error("Class not found.");
  }

  if ((space.createdBy ?? space.ownerId) !== profile.id) {
    throw new Error("Teachers can only edit classes they created.");
  }

  const client = await getWriteClient();
  const timestamp = nowInShanghaiIso();
  const payload = {
    class_id: space.id,
    requested_by: profile.id,
    proposed_title: input.title?.trim() || space.title,
    proposed_slug: input.slug?.trim() || space.slug,
    proposed_description: input.description === undefined ? space.description : normalizeNullableText(input.description),
    proposed_academic_year: input.academic_year === undefined ? space.academicYear : normalizeNullableText(input.academic_year),
    proposed_status: input.status ?? space.status,
    status: "pending" as const,
    submitted_at: timestamp,
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
  };

  const { data: existing, error: existingError } = await client
    .from("class_update_requests")
    .select("*")
    .eq("class_id", space.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const result = existing
    ? await client.from("class_update_requests").update(payload).eq("id", existing.id).select("*").single()
    : await client.from("class_update_requests").insert(payload).select("*").single();

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Failed to submit class update request.");
  }

  return mapClassUpdateRequestRow(result.data);
}

export async function listPendingClassUpdateRequests(classIds: string[]): Promise<ClassUpdateRequestSummary[]> {
  const uniqueClassIds = [...new Set(classIds)].filter(Boolean);
  if (uniqueClassIds.length === 0) {
    return [];
  }

  const client = await createSupabaseServerClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("class_update_requests")
    .select("*")
    .eq("status", "pending")
    .in("class_id", uniqueClassIds)
    .order("submitted_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load class update requests.");
  }

  return data.map(mapClassUpdateRequestRow);
}

async function getPendingClassUpdateRequest(requestId: string) {
  const client = await getWriteClient();
  const { data, error } = await client
    .from("class_update_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapClassUpdateRequestRow(data) : null;
}

export async function approveClassUpdateRequest(profile: AppUserProfile, requestId: string) {
  assertSuperAdmin(profile);

  const request = await getPendingClassUpdateRequest(requestId);
  if (!request) {
    throw new Error("Class update request not found.");
  }

  const classSpace = await getSpaceById(request.classId);
  if (!classSpace || classSpace.type !== "class") {
    throw new Error("Class not found.");
  }

  const client = await getWriteClient();
  const timestamp = nowInShanghaiIso();
  const updated = await updateSpace(
    {
      id: request.classId,
      type: "class",
      title: request.proposedTitle,
      slug: request.proposedSlug,
      description: request.proposedDescription,
      academic_year: request.proposedAcademicYear,
      status: request.proposedStatus,
    },
    client,
  );

  const { error } = await client
    .from("class_update_requests")
    .update({
      status: "approved",
      reviewed_at: timestamp,
      reviewed_by: profile.id,
      rejection_reason: null,
    })
    .eq("id", request.id);

  if (error) {
    throw new Error(error.message);
  }

  await notifyClassContentChanged({
    classId: updated.id,
    contentType: "class",
    contentId: updated.id,
    actionType: "edited",
    title: updated.title,
    message: `班级「${updated.title}」的信息已更新，请查看最新班级说明。`,
  });

  return updated;
}

export async function rejectClassUpdateRequest(profile: AppUserProfile, requestId: string, reason?: string | null) {
  assertSuperAdmin(profile);

  const request = await getPendingClassUpdateRequest(requestId);
  if (!request) {
    throw new Error("Class update request not found.");
  }

  const client = await getWriteClient();
  const { error } = await client
    .from("class_update_requests")
    .update({
      status: "rejected",
      reviewed_at: nowInShanghaiIso(),
      reviewed_by: profile.id,
      rejection_reason: reason?.trim() || null,
    })
    .eq("id", request.id);

  if (error) {
    throw new Error(error.message);
  }

  return request;
}
