import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { classTaskSchema } from "@/lib/validations/class-teaching-content";
import { createClassTask, listClassTasks } from "@/repositories/class-teaching-content-repository";

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const url = new URL(request.url);
    const items = await listClassTasks(context.classId, {
      mode: (url.searchParams.get("mode") ?? "published") as "published" | "drafts" | "archived",
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
    const input = classTaskSchema.parse(await request.json());
    const item = await createClassTask(context.profile.id, context.classId, input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
