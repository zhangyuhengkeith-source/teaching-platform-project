import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { findProfileById } from "@/repositories/profile-repository";

export async function GET() {
  const session = await getSession();
  const profile = session.profile ? await findProfileById(session.profile.id) : null;

  return NextResponse.json({
    ...session,
    profile: profile ?? session.profile,
  });
}
