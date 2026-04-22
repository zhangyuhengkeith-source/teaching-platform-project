import { NextResponse } from "next/server";

import { requireClassManagementApiContext, toClassManagementApiErrorResponse } from "@/lib/auth/require-class-management-api";
import { ensureAutoGroupingForDueRule } from "@/repositories/class-group-repository";

export async function POST(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params;
    const context = await requireClassManagementApiContext(classId);
    const result = await ensureAutoGroupingForDueRule(context.classId);

    return NextResponse.json(result);
  } catch (error) {
    return toClassManagementApiErrorResponse(error);
  }
}
