import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/require-auth";
import { listSpacesForUser } from "@/lib/queries/spaces";

export async function GET() {
  const profile = await requireAuth();
  const spaces = await listSpacesForUser(profile.id);

  return NextResponse.json({
    items: spaces,
  });
}
