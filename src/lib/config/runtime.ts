const DEMO_MODE_FLAG = "true";

export const SUPABASE_CONFIG_ERROR =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using authenticated routes.";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export function isDemoModeEnabled() {
  return process.env.NEXT_PUBLIC_TP_ENABLE_DEMO_MODE === DEMO_MODE_FLAG;
}

export function canUseDemoMode() {
  return !isSupabaseConfigured() && isDemoModeEnabled();
}
