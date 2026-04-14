import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { canUseDemoMode, getSupabaseConfig } from "@/lib/config/runtime";

const PROTECTED_PREFIXES = ["/dashboard", "/classes", "/electives", "/service", "/notifications", "/profile", "/wrong-book", "/admin", "/waiting-assignment"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!config) {
    if (!isProtected || canUseDemoMode()) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    redirectUrl.searchParams.set("reason", "config");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Failed to fetch Supabase session in middleware.", error);
    }

    if (isProtected && !session) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("Unexpected middleware failure while checking auth.", error);
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/classes/:path*", "/electives/:path*", "/service/:path*", "/notifications/:path*", "/profile/:path*", "/wrong-book/:path*", "/admin/:path*", "/waiting-assignment/:path*"],
};
