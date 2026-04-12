import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { getProfileByUserId } from "@/lib/queries/profiles";

export async function GET() {
  const session = await getSession();
  const profile = session.profile ? await getProfileByUserId(session.profile.id) : null;

  return NextResponse.json({
    ...session,
    profile: profile ?? session.profile,
  });
}
