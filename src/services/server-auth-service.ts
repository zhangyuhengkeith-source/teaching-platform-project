import { getApiBaseUrl, getAuthMode } from "@/lib/config/app-config";
import { canUseDemoMode, isSupabaseConfigured } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ServerAuthIdentity {
  id: string;
  email: string | null;
  metadata: Record<string, unknown>;
}

export type ServerAuthResolution =
  | { kind: "demo" }
  | { kind: "unauthenticated" }
  | { kind: "authenticated"; identity: ServerAuthIdentity };

function getUnsupportedServerAuthModeMessage() {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl) {
    return `Auth mode "${getAuthMode()}" is configured, but the server auth service still needs a provider implementation for ${apiBaseUrl}.`;
  }

  return `Auth mode "${getAuthMode()}" is configured, but the server auth service still needs a provider implementation.`;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

// Migration seam: resolve server-side identity from the active auth provider here.
export async function resolveServerAuthIdentity(): Promise<ServerAuthResolution> {
  if (canUseDemoMode()) {
    return { kind: "demo" };
  }

  if (getAuthMode() !== "supabase") {
    throw new Error(getUnsupportedServerAuthModeMessage());
  }

  if (!isSupabaseConfigured()) {
    return { kind: "unauthenticated" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { kind: "demo" };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Failed to fetch authenticated user on the server.", authError);
    return { kind: "unauthenticated" };
  }

  if (!user) {
    return { kind: "unauthenticated" };
  }

  return {
    kind: "authenticated",
    identity: {
      id: user.id,
      email: user.email ?? null,
      metadata: normalizeMetadata(user.user_metadata),
    },
  };
}
