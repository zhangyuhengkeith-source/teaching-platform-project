import { NextResponse } from "next/server";

import {
  requireClassManagementApiContext,
  toClassManagementApiErrorResponse,
} from "@/lib/auth/require-class-management-api";
import {
  getCourseChapterSetById,
  listCourseChapterTemplates,
  saveCourseChapterSetAsTemplate,
} from "@/repositories/course-chapter-repository";
import { saveCourseChapterTemplateSchema } from "@/lib/validations/course-chapters";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    await requireClassManagementApiContext(classId);
    const items = await listCourseChapterTemplates();

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
    const input = saveCourseChapterTemplateSchema.parse(body);
    const chapterSet = await getCourseChapterSetById(input.chapter_set_id);

    if (!chapterSet || chapterSet.classId !== context.classId || chapterSet.status === "deleted") {
      return NextResponse.json({ error: "Chapter set does not belong to this class." }, { status: 403 });
    }

    const item = await saveCourseChapterSetAsTemplate(context.profile.id, input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
