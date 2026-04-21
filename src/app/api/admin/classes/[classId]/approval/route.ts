import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/require-role";
import { buildClassSlug } from "@/lib/constants/class-subjects";
import {
  approveClassRequest,
  rejectClassRequest,
  resubmitRejectedClassRequest,
} from "@/lib/server/class-approval-service";
import { createClassFormSchema } from "@/lib/validations/class-space";

const approvalApiSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().max(1000).optional().nullable() }),
  z.object({ action: z.literal("resubmit"), class: createClassFormSchema }),
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = approvalApiSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid class approval payload." }, { status: 400 });
  }

  if (parsed.data.action === "approve") {
    const updated = await approveClassRequest(profile, classId);
    return NextResponse.json({ item: updated });
  }

  if (parsed.data.action === "reject") {
    const updated = await rejectClassRequest(profile, classId, parsed.data.reason);
    return NextResponse.json({ item: updated });
  }

  const updated = await resubmitRejectedClassRequest(profile, {
    ...parsed.data.class,
    id: classId,
    slug: buildClassSlug(parsed.data.class.subject, parsed.data.class.title, parsed.data.class.academic_year),
  });

  return NextResponse.json({ item: updated });
}
