import { NextResponse } from "next/server";

import {
  requireClassManagementApiContext,
  toClassManagementApiErrorResponse,
} from "@/lib/auth/require-class-management-api";
import { isAdminRole } from "@/lib/permissions/profiles";
import {
  createCourseChapterSet,
  listCourseChapterSetsByClassId,
} from "@/repositories/course-chapter-repository";
import { courseChapterSetSchema } from "@/lib/validations/course-chapters";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const items = await listCourseChapterSetsByClassId(context.classId, {
      includeArchived: isAdminRole(context.profile),
    });

    return NextResponse.json({ items });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const body = await request.json();
    const input = courseChapterSetSchema.parse({
      ...body,
      class_id: context.classId,
    });
    const item = await createCourseChapterSet(context.profile.id, input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
