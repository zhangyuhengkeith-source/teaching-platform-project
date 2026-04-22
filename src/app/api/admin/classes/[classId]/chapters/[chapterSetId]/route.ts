import { NextResponse } from "next/server";

import {
  requireClassManagementApiContext,
  toClassManagementApiErrorResponse,
} from "@/lib/auth/require-class-management-api";
import {
  deleteCourseChapterSet,
  getCourseChapterSetById,
  updateCourseChapterSet,
} from "@/repositories/course-chapter-repository";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";
import { updateCourseChapterSetSchema } from "@/lib/validations/course-chapters";

async function requireChapterSetInClass(chapterSetId: string, classId: string) {
  const chapterSet = await getCourseChapterSetById(chapterSetId);

  if (!chapterSet || chapterSet.classId !== classId || chapterSet.status === "deleted") {
    throw new Error("Course chapter set not found.");
  }

  return chapterSet;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ classId: string; chapterSetId: string }> },
) {
  try {
    const { classId, chapterSetId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const current = await requireChapterSetInClass(chapterSetId, context.classId);
    const body = await request.json();
    const input = updateCourseChapterSetSchema.parse({
      ...body,
      id: chapterSetId,
      class_id: context.classId,
    });
    const item = await updateCourseChapterSet(context.profile.id, input);

    await notifyClassContentChanged({
      classId: context.classId,
      contentType: "chapter",
      contentId: item.id,
      actionType: input.status === "archived" && current.status !== "archived" ? "archived" : "edited",
      title: item.mainTitle,
      message: `Course chapters "${item.mainTitle}" were updated.`,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ classId: string; chapterSetId: string }> },
) {
  try {
    const { classId, chapterSetId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const current = await requireChapterSetInClass(chapterSetId, context.classId);
    const item = await deleteCourseChapterSet(context.profile.id, chapterSetId);

    await notifyClassContentChanged({
      classId: context.classId,
      contentType: "chapter",
      contentId: item.id,
      actionType: "deleted",
      title: current.mainTitle,
      message: `Course chapters "${current.mainTitle}" were deleted.`,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
