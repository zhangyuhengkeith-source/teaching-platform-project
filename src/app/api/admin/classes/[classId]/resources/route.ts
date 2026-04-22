import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { isAdminRole } from "@/lib/permissions/profiles";
import { classResourceSchema } from "@/lib/validations/class-teaching-content";
import { createClassResource, listClassResources } from "@/repositories/class-teaching-content-repository";

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") ?? "published") as "published" | "drafts" | "archived";

    if (mode === "archived" && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can view archived resources." }, { status: 403 });
    }

    const items = await listClassResources(context.classId, {
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
    const input = classResourceSchema.parse(await request.json());
    const item = await createClassResource(context.profile.id, context.classId, input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
