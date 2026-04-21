import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/require-role";
import { buildClassSlug } from "@/lib/constants/class-subjects";
import { listAdminClassCards } from "@/lib/queries/admin-classes";
import { createClassApprovalRequest } from "@/lib/server/class-approval-service";
import { createClassFormSchema } from "@/lib/validations/class-space";

export async function GET() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const classes = await listAdminClassCards(profile);

  return NextResponse.json({ items: classes });
}

export async function POST(request: Request) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const parsed = createClassFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid class request payload." }, { status: 400 });
  }

  const created = await createClassApprovalRequest(profile, {
    ...parsed.data,
    slug: buildClassSlug(parsed.data.subject, parsed.data.title, parsed.data.academic_year),
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
