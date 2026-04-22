import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { isAdminRole } from "@/lib/permissions/profiles";
import { updateClassGroupSchema } from "@/lib/validations/class-groups";
import { getClassGroupById, updateClassGroup } from "@/repositories/class-group-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string; groupId: string }> }) {
  try {
    const { classId, groupId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const item = await getClassGroupById(context.classId, groupId);

    if (!item || item.status === "deleted") {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    if (item.status === "archived" && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can view archived groups." }, { status: 403 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ classId: string; groupId: string }> }) {
  try {
    const { classId, groupId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const input = updateClassGroupSchema.parse(await request.json());
    const item = await updateClassGroup(context.classId, {
      id: groupId,
      ...input,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ classId: string; groupId: string }> }) {
  try {
    const { classId, groupId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const current = await getClassGroupById(context.classId, groupId);

    if (!current || current.status === "deleted") {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    if (current.status === "archived" && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can delete archived groups." }, { status: 403 });
    }

    const item = await updateClassGroup(context.classId, {
      id: groupId,
      status: "deleted",
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
