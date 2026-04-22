import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { isAdminRole } from "@/lib/permissions/profiles";
import { classContentActionSchema, classPracticeSetSchema } from "@/lib/validations/class-teaching-content";
import { getClassPracticeSetById, publishNowPatch, updateClassPracticeSet } from "@/repositories/class-teaching-content-repository";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string; practiceSetId: string }> }) {
  try {
    const { classId, practiceSetId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const item = await getClassPracticeSetById(context.classId, practiceSetId);

    if (!item || item.status === "deleted") {
      return NextResponse.json({ error: "Practice set not found." }, { status: 404 });
    }

    if (item.status === "archived" && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can view archived practice sets." }, { status: 403 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ classId: string; practiceSetId: string }> }) {
  try {
    const { classId, practiceSetId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const current = await getClassPracticeSetById(context.classId, practiceSetId);

    if (!current || current.status === "deleted") {
      return NextResponse.json({ error: "Practice set not found." }, { status: 404 });
    }

    const body = await request.json();
    const actionInput = classContentActionSchema.safeParse(body);
    const action = actionInput.success ? actionInput.data.action : undefined;
    const input =
      action === "archive"
        ? { status: "archived" as const }
        : action === "publish_now"
          ? publishNowPatch()
          : action === "reschedule"
            ? { publish_at: actionInput.success ? actionInput.data.publish_at : null }
            : classPracticeSetSchema.partial().parse(body);

    const item = await updateClassPracticeSet(context.profile.id, current, input);
    await notifyClassContentChanged({
      classId: context.classId,
      contentType: "practice_set",
      contentId: item.id,
      actionType: item.status === "archived" ? "archived" : "edited",
      title: item.title,
      message: `Practice set "${item.title}" was ${item.status === "archived" ? "archived" : "updated"}.`,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ classId: string; practiceSetId: string }> }) {
  try {
    const { classId, practiceSetId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const current = await getClassPracticeSetById(context.classId, practiceSetId);

    if (!current || current.status === "deleted") {
      return NextResponse.json({ error: "Practice set not found." }, { status: 404 });
    }

    if (current.status === "archived" && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can delete archived practice sets." }, { status: 403 });
    }

    const item = await updateClassPracticeSet(context.profile.id, current, { status: "deleted" });
    await notifyClassContentChanged({
      classId: context.classId,
      contentType: "practice_set",
      contentId: item.id,
      actionType: "deleted",
      title: current.title,
      message: `Practice set "${current.title}" was deleted.`,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
