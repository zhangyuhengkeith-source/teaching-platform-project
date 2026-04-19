import { createClient } from "@supabase/supabase-js";

import { canUseDemoMode, getSupabaseConfig, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

interface CreateSupabaseServerWriteClientOptions {
  requireServiceRole?: boolean;
}

export async function createSupabaseServerWriteClient(options: CreateSupabaseServerWriteClientOptions = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    if (canUseDemoMode()) {
      return null;
    }

    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    if (options.requireServiceRole) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not available for trusted server-side writes.");
    }

    return createSupabaseServerClient();
  }

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
