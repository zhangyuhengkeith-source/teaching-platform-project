import { NextResponse } from "next/server";

import {
  requireClassManagementApiContext,
  toClassManagementApiErrorResponse,
} from "@/lib/auth/require-class-management-api";
import { importCourseChapterTemplate } from "@/repositories/course-chapter-repository";
import { importCourseChapterTemplateSchema } from "@/lib/validations/course-chapters";

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const body = await request.json();
    const input = importCourseChapterTemplateSchema.parse(body);
    const item = await importCourseChapterTemplate(context.profile.id, context.classId, input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
