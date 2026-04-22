import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { createClassGroupingRuleSchema } from "@/lib/validations/class-groups";
import { createClassGroupingRule, listClassGroupingRules } from "@/repositories/class-group-repository";
import { fromShanghaiDateTimeInputValue } from "@/lib/utils/timezone";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const items = await listClassGroupingRules(context.classId);

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
    const input = createClassGroupingRuleSchema.parse({
      ...body,
      deadline: fromShanghaiDateTimeInputValue(body.deadline) ?? body.deadline,
    });
    const item = await createClassGroupingRule(context.profile.id, context.classId, input);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
