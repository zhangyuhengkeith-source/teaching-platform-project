import type { NextRequest } from "next/server";

import { middleware as supabaseMiddleware } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return supabaseMiddleware(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/classes/:path*", "/electives/:path*", "/service/:path*", "/notifications/:path*", "/profile/:path*", "/wrong-book/:path*", "/admin/:path*", "/waiting-assignment/:path*"],
};
