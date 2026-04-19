"use client";

import { getApiBaseUrl, getAuthMode } from "@/lib/config/app-config";
import { canUseDemoMode, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthExecutionMode = "provider" | "demo";

interface SignInWithPasswordInput {
  email: string;
  password: string;
}

interface SignUpWithPasswordInput {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

function getUnsupportedAuthModeMessage() {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl) {
    return `Auth mode "${getAuthMode()}" is configured, but the browser auth service still needs a provider implementation for ${apiBaseUrl}.`;
  }

  return `Auth mode "${getAuthMode()}" is configured, but the browser auth service still needs a provider implementation.`;
}

function resolveBrowserAuthClient() {
  if (getAuthMode() !== "supabase") {
    throw new Error(getUnsupportedAuthModeMessage());
  }

  const client = createSupabaseBrowserClient();

  if (!client && !canUseDemoMode()) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  return client;
}

// Migration seam: replace the underlying auth provider here without touching page components.
export async function signInWithPassword(input: SignInWithPasswordInput): Promise<{ mode: AuthExecutionMode }> {
  const client = resolveBrowserAuthClient();

  if (!client) {
    return { mode: "demo" };
  }

  const { error } = await client.auth.signInWithPassword(input);

  if (error) {
    throw new Error(error.message);
  }

  return { mode: "provider" };
}

// Migration seam: email/password signup lives behind a neutral service contract.
export async function signUpWithPassword(input: SignUpWithPasswordInput): Promise<{ mode: AuthExecutionMode }> {
  const client = resolveBrowserAuthClient();

  if (!client) {
    return { mode: "demo" };
  }

  const { error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: input.metadata,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return { mode: "provider" };
}

export async function signOutCurrentUser(): Promise<void> {
  const client = resolveBrowserAuthClient();

  if (!client) {
    return;
  }

  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}
