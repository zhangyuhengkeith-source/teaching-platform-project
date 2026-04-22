import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { isCompatibleExerciseItemType } from "@/lib/exercises/item-compatibility";
import { createExerciseItem } from "@/lib/mutations/exercises";
import { isAdminRole } from "@/lib/permissions/profiles";
import { classPracticeSetWithItemsSchema } from "@/lib/validations/class-teaching-content";
import { createExerciseItemSchema } from "@/lib/validations/exercises";
import { createClassPracticeSet, listClassPracticeSets } from "@/repositories/class-teaching-content-repository";

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") ?? "published") as "published" | "drafts" | "archived";

    if (mode === "archived" && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can view archived practice sets." }, { status: 403 });
    }

    const items = await listClassPracticeSets(context.classId, {
      mode,
      chapterId: url.searchParams.get("chapter_id"),
      type: url.searchParams.get("type"),
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
    const input = classPracticeSetWithItemsSchema.parse(await request.json());
    const parsedItems = (input.items ?? []).map((rawItem, index) => {
      const parsedItem = createExerciseItemSchema.parse({
        ...rawItem,
        exercise_set_id: crypto.randomUUID(),
        sort_order: typeof rawItem.sort_order === "number" ? rawItem.sort_order : index,
      });

      if (!isCompatibleExerciseItemType(input.exercise_type, parsedItem.item_type)) {
        throw new Error("All items in a practice set must match the practice type.");
      }

      return parsedItem;
    });

    if (parsedItems.length === 0) {
      throw new Error("Add at least one practice question.");
    }

    const item = await createClassPracticeSet(context.profile.id, context.classId, input);

    for (const parsedItem of parsedItems) {
      await createExerciseItem({
        ...parsedItem,
        exercise_set_id: item.id,
      });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
