import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl, getAuthMode, getSupabaseConfig } from "@/lib/config/app-config";
import { canUseDemoMode } from "@/lib/config/runtime";
import type { Database } from "@/types/database";

export interface MiddlewareAuthContext {
  response: NextResponse;
  status: "authenticated" | "unauthenticated" | "provider_unavailable";
}

function getUnsupportedMiddlewareAuthModeMessage() {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl) {
    return `Auth mode "${getAuthMode()}" is configured, but the middleware auth service still needs a provider implementation for ${apiBaseUrl}.`;
  }

  return `Auth mode "${getAuthMode()}" is configured, but the middleware auth service still needs a provider implementation.`;
}

// Migration seam: resolve request-level authentication in middleware without
// leaking provider-specific session checks back into route matching logic.
export async function resolveMiddlewareAuthContext(request: NextRequest): Promise<MiddlewareAuthContext> {
  const response = NextResponse.next({ request });

  if (canUseDemoMode()) {
    return { response, status: "authenticated" };
  }

  if (getAuthMode() !== "supabase") {
    console.error(getUnsupportedMiddlewareAuthModeMessage());
    return { response, status: "provider_unavailable" };
  }

  const config = getSupabaseConfig();

  if (!config) {
    return { response, status: "provider_unavailable" };
  }

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
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
    console.error("Failed to resolve authenticated session in middleware.", error);
  }

  return {
    response,
    status: session ? "authenticated" : "unauthenticated",
  };
}
