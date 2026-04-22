import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { isCompatibleExerciseItemType } from "@/lib/exercises/item-compatibility";
import { replaceExerciseItemsForSet } from "@/lib/mutations/exercises";
import { isAdminRole } from "@/lib/permissions/profiles";
import { listItemsForExerciseSet } from "@/lib/queries/exercises";
import { classContentActionSchema, classPracticeSetWithItemsSchema } from "@/lib/validations/class-teaching-content";
import { createExerciseItemSchema } from "@/lib/validations/exercises";
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

    return NextResponse.json({
      item: {
        ...item,
        items: await listItemsForExerciseSet(item.id),
      },
    });
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
    const practiceSetInput = action ? null : classPracticeSetWithItemsSchema.partial().parse(body);
    const input =
      action === "archive"
        ? { status: "archived" as const }
        : action === "publish_now"
          ? publishNowPatch()
          : action === "reschedule"
            ? { publish_at: actionInput.success ? actionInput.data.publish_at : null }
            : practiceSetInput!;

    const item = await updateClassPracticeSet(context.profile.id, current, input);
    if (!action && practiceSetInput?.items) {
      const parsedItems = practiceSetInput.items.map((rawItem, index) => {
        const parsedItem = createExerciseItemSchema.parse({
          ...rawItem,
          exercise_set_id: item.id,
          sort_order: typeof rawItem.sort_order === "number" ? rawItem.sort_order : index,
        });

        if (!isCompatibleExerciseItemType(item.exerciseType, parsedItem.item_type)) {
          throw new Error("All items in a practice set must match the practice type.");
        }

        return parsedItem;
      });

      if (parsedItems.length === 0) {
        throw new Error("Add at least one practice question.");
      }

      await replaceExerciseItemsForSet(item.id, parsedItems);
    }

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
