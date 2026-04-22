import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { isAdminRole } from "@/lib/permissions/profiles";
import { createClassGroupSchema, groupStatusFilterSchema } from "@/lib/validations/class-groups";
import {
  createClassGroup,
  ensureAutoGroupingForDueRule,
  listClassGroups,
  listClassStudentsWithGroupState,
  getLatestClassGroupingRule,
} from "@/repositories/class-group-repository";

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    await ensureAutoGroupingForDueRule(context.classId);

    const url = new URL(request.url);
    const joinStatus = groupStatusFilterSchema.parse(url.searchParams.get("join_status") ?? "all");
    const includeArchived = joinStatus === "archived";

    if (includeArchived && !isAdminRole(context.profile)) {
      return NextResponse.json({ error: "Only admins can view archived groups." }, { status: 403 });
    }

    const [items, students, rule] = await Promise.all([
      listClassGroups(context.classId, {
        includeArchived,
        joinStatus: joinStatus === "archived" ? "all" : joinStatus,
      }),
      listClassStudentsWithGroupState(context.classId),
      getLatestClassGroupingRule(context.classId),
    ]);

    return NextResponse.json({
      items: includeArchived ? items.filter((item) => item.status === "archived") : items,
      students,
      rule,
    });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const input = createClassGroupSchema.parse(await request.json());
    const item = await createClassGroup(context.profile.id, context.classId, input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
