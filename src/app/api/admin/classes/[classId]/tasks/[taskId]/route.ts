import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { isAdminRole } from "@/lib/permissions/profiles";
import { classContentActionSchema, classTaskSchema } from "@/lib/validations/class-teaching-content";
import { getClassTaskById, publishNowPatch, updateClassTask } from "@/repositories/class-teaching-content-repository";
import { notifyClassContentChanged } from "@/services/content-change-notification-service";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string; taskId: string }> }) {
  try {
    const { classId, taskId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const item = await getClassTaskById(context.classId, taskId);

    if (!item || item.status === "deleted") {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ classId: string; taskId: string }> }) {
  try {
    const { classId, taskId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const current = await getClassTaskById(context.classId, taskId);

    if (!current || current.status === "deleted") {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
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
            : classTaskSchema.partial().parse(body);

    const item = await updateClassTask(current, input);
    await notifyClassContentChanged({
      classId: context.classId,
      contentType: "assignment",
      contentId: item.id,
      actionType: item.status === "archived" ? "archived" : "edited",
      title: item.title,
      message: `Task "${item.title}" was ${item.status === "archived" ? "archived" : "updated"}.`,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ classId: string; taskId: string }> }) {
  try {
    const { classId, taskId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const current = await getClassTaskById(context.classId, taskId);

    if (!current || current.status === "deleted") {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    if (current.status === "archived" && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can delete archived tasks." }, { status: 403 });
    }

    const item = await updateClassTask(current, { status: "deleted" });
    await notifyClassContentChanged({
      classId: context.classId,
      contentType: "assignment",
      contentId: item.id,
      actionType: "deleted",
      title: current.title,
      message: `Task "${current.title}" was deleted.`,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
