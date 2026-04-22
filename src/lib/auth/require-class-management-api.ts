import { NextResponse } from "next/server";

import { canAccessClass } from "@/lib/auth/class-permissions";
import { requireRole } from "@/lib/auth/require-role";
import { getSpaceById, listMembershipsForSpace, listSectionsForSpace } from "@/lib/queries/spaces";
import type { AppUserProfile } from "@/types/auth";
import type { SpaceDetail, SpaceMembershipSummary } from "@/types/domain";

export class ClassManagementApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ClassManagementApiError";
    this.status = status;
  }
}

export interface ClassManagementApiContext {
  profile: AppUserProfile;
  classSpace: SpaceDetail;
  memberships: SpaceMembershipSummary[];
  classId: string;
}

export async function requireClassManagementApiContext(classId: string): Promise<ClassManagementApiContext> {
  const profile = await requireRole(["super_admin", "teacher"]);
  const classSpace = await getSpaceById(classId);

  if (!classSpace || classSpace.type !== "class") {
    throw new ClassManagementApiError("Class not found.", 404);
  }

  const [memberships, sections] = await Promise.all([
    listMembershipsForSpace(classSpace.id),
    listSectionsForSpace(classSpace.id),
  ]);

  if (!canAccessClass(profile, { classSpace, memberships })) {
    throw new ClassManagementApiError("You do not have permission to access this class.", 403);
  }

  if ((classSpace.approvalStatus ?? "approved") !== "approved") {
    throw new ClassManagementApiError("Class not found.", 404);
  }

  return {
    profile,
    classId: classSpace.id,
    classSpace: {
      ...classSpace,
      memberships,
      sections,
    },
    memberships,
  };
}

export function toClassManagementApiErrorResponse(error: unknown) {
  if (error instanceof ClassManagementApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Request failed.";
  return NextResponse.json({ error: message }, { status: 400 });
}
