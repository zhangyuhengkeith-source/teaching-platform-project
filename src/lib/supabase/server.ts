import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { canUseDemoMode, getSupabaseConfig, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (!config) {
    if (canUseDemoMode()) {
      return null;
    }

    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
