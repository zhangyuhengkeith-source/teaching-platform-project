"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  approveClassRequest,
  createClassApprovalRequest,
  rejectClassRequest,
  resubmitRejectedClassRequest,
} from "@/lib/server/class-approval-service";
import { buildClassSlug } from "@/lib/constants/class-subjects";
import { requireRole } from "@/lib/auth/require-role";
import { createClassFormSchema, updateClassFormSchema } from "@/lib/validations/class-space";

const approvalActionSchema = z.object({
  classId: z.string().uuid(),
});

const rejectClassSchema = approvalActionSchema.extend({
  reason: z.string().trim().max(1000).optional().nullable(),
});

export interface ClassApprovalActionResult {
  ok: boolean;
  error?: string;
}

function revalidateClassAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}

export async function createClassApprovalRequestAction(input: unknown): Promise<ClassApprovalActionResult> {
  try {
    const profile = await requireRole(["super_admin", "teacher"]);
    const parsed = createClassFormSchema.parse(input);
    await createClassApprovalRequest(profile, {
      ...parsed,
      slug: buildClassSlug(parsed.subject, parsed.title, parsed.academic_year),
    });
    revalidateClassAdmin();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create class request." };
  }
}

export async function resubmitRejectedClassRequestAction(input: unknown): Promise<ClassApprovalActionResult> {
  try {
    const profile = await requireRole(["super_admin", "teacher"]);
    const parsed = updateClassFormSchema.parse(input);
    await resubmitRejectedClassRequest(profile, {
      ...parsed,
      slug: buildClassSlug(parsed.subject, parsed.title, parsed.academic_year),
    });
    revalidateClassAdmin();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to resubmit class request." };
  }
}

export async function approveClassRequestAction(input: unknown): Promise<ClassApprovalActionResult> {
  try {
    const profile = await requireRole(["super_admin"]);
    const parsed = approvalActionSchema.parse(input);
    const updated = await approveClassRequest(profile, parsed.classId);
    revalidateClassAdmin();
    revalidatePath(`/classes/${updated.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to approve class request." };
  }
}

export async function rejectClassRequestAction(input: unknown): Promise<ClassApprovalActionResult> {
  try {
    const profile = await requireRole(["super_admin"]);
    const parsed = rejectClassSchema.parse(input);
    await rejectClassRequest(profile, parsed.classId, parsed.reason);
    revalidateClassAdmin();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to reject class request." };
  }
}
