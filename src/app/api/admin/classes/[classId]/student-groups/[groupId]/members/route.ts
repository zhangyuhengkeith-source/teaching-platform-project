import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { moveClassGroupMemberSchema } from "@/lib/validations/class-groups";
import { moveClassGroupMember } from "@/repositories/class-group-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ classId: string; groupId: string }> },
) {
  try {
    const { classId, groupId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const input = moveClassGroupMemberSchema.parse({
      ...(await request.json()),
      target_group_id: groupId === "no-group" ? null : groupId,
    });
    const items = await moveClassGroupMember(context.classId, input);

    return NextResponse.json({ items });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
