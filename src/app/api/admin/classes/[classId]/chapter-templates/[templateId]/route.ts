import { NextResponse } from "next/server";

import {
  requireClassManagementApiContext,
  toClassManagementApiErrorResponse,
} from "@/lib/auth/require-class-management-api";
import { isAdminRole } from "@/lib/permissions/profiles";
import {
  deleteCourseChapterTemplate,
  listCourseChapterTemplates,
} from "@/repositories/course-chapter-repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ classId: string; templateId: string }> },
) {
  try {
    const { classId, templateId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const templates = await listCourseChapterTemplates();
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }

    if (!isAdminRole(context.profile) && template.createdBy !== context.profile.id) {
      return NextResponse.json({ error: "You do not have permission to delete this template." }, { status: 403 });
    }

    await deleteCourseChapterTemplate(templateId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
