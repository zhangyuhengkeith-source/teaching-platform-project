import type { NextRequest } from "next/server";

import { PROTECTED_ROUTE_MATCHER } from "@/lib/auth/protected-routes";
import { middleware as supabaseMiddleware } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return supabaseMiddleware(request);
}

export const config = {
  matcher: PROTECTED_ROUTE_MATCHER,
};
