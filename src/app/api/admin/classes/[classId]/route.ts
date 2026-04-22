import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/require-role";
import { canAccessClass } from "@/lib/auth/class-permissions";
import { isAdminRole } from "@/lib/permissions/profiles";
import { getSpaceById, listMembershipsForSpace, listSectionsForSpace } from "@/lib/queries/spaces";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const profile = await requireRole(["super_admin", "teacher"]);
  const classSpace = await getSpaceById(classId);

  if (!classSpace || classSpace.type !== "class") {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const [memberships, sections] = await Promise.all([
    listMembershipsForSpace(classSpace.id),
    listSectionsForSpace(classSpace.id),
  ]);

  if (!canAccessClass(profile, { classSpace, memberships })) {
    return NextResponse.json({ error: "You do not have permission to access this class." }, { status: 403 });
  }

  const approvalStatus = classSpace.approvalStatus ?? "approved";
  const createdBy = classSpace.createdBy ?? classSpace.ownerId;
  const canViewApprovalState = isAdminRole(profile) || approvalStatus === "approved" || createdBy === profile.id;

  if (!canViewApprovalState) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...classSpace,
      memberships,
      sections,
      classId: classSpace.id,
    },
  });
}
