import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/require-auth";
import { listVisibleSpacesForUser } from "@/lib/queries/spaces";

export async function GET() {
  const profile = await requireAuth();
  const spaces = await listVisibleSpacesForUser(profile);

  return NextResponse.json({
    items: spaces,
  });
}
