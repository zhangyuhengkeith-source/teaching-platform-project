import { NextResponse, type NextRequest } from "next/server";

import { PROTECTED_PREFIXES, PROTECTED_ROUTE_MATCHER } from "@/lib/auth/protected-routes";
import { resolveMiddlewareAuthContext } from "@/services/middleware-auth-service";

export async function middleware(request: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  try {
    const authContext = await resolveMiddlewareAuthContext(request);

    if (isProtected && authContext.status !== "authenticated") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      if (authContext.status === "provider_unavailable") {
        redirectUrl.searchParams.set("reason", "config");
      }
      return NextResponse.redirect(redirectUrl);
    }

    return authContext.response;
  } catch (error) {
    console.error("Unexpected middleware failure while checking auth.", error);
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      redirectUrl.searchParams.set("reason", "config");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: PROTECTED_ROUTE_MATCHER,
};
