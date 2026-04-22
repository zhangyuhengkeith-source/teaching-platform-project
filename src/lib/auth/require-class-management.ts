import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { canAccessClass } from "@/lib/auth/class-permissions";
import { listMembershipsForSpace, listSectionsForSpace, getSpaceById } from "@/lib/queries/spaces";
import type { AppUserProfile } from "@/types/auth";
import type { SpaceDetail, SpaceMembershipSummary } from "@/types/domain";

export interface ClassManagementContext {
  profile: AppUserProfile;
  classSpace: SpaceDetail;
  memberships: SpaceMembershipSummary[];
  classId: string;
}

export async function requireClassManagementContext(classId: string): Promise<ClassManagementContext> {
  const profile = await requireRole(["super_admin", "teacher"]);
  const classSpace = await getSpaceById(classId);

  if (!classSpace || classSpace.type !== "class") {
    notFound();
  }

  const [memberships, sections] = await Promise.all([
    listMembershipsForSpace(classSpace.id),
    listSectionsForSpace(classSpace.id),
  ]);

  if (!canAccessClass(profile, { classSpace, memberships })) {
    notFound();
  }

  if ((classSpace.approvalStatus ?? "approved") !== "approved") {
    notFound();
  }

  return {
    profile,
    classSpace: {
      ...classSpace,
      memberships,
      sections,
    },
    memberships,
    classId: classSpace.id,
  };
}
