import { getSupabaseConfig as getAppSupabaseConfig, isDemoModeEnabled as isAppDemoModeEnabled } from "@/lib/config/app-config";

export const SUPABASE_CONFIG_ERROR =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using authenticated routes.";

export function getSupabaseConfig() {
  return getAppSupabaseConfig();
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export function isDemoModeEnabled() {
  return isAppDemoModeEnabled();
}

export function canUseDemoMode() {
  return !isSupabaseConfigured() && isDemoModeEnabled();
}
