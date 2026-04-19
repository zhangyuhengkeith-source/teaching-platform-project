type DeploymentFlavor = "default" | "production-cn";
type AuthMode = "supabase" | "custom-api";
type StorageMode = "supabase" | "object-storage";

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface AppConfig {
  deploymentFlavor: DeploymentFlavor;
  appBaseUrl: string | null;
  apiBaseUrl: string | null;
  authMode: AuthMode;
  storageMode: StorageMode;
  demoModeEnabled: boolean;
  bootstrapAdminEmails: string[];
  supabase: SupabaseConfig | null;
}

const DEMO_MODE_FLAG = "true";
const DEFAULT_BOOTSTRAP_ADMIN_EMAILS = ["zhangyuheng_andy@163.com"];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function readCsvEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function readEnumValue<T extends string>(value: string | undefined, allowedValues: readonly T[], fallback: T): T {
  return value && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function getSupabaseConfigFromEnv(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

function getBootstrapAdminEmailsFromEnv() {
  const configuredEmails = readCsvEnv(process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS).map(normalizeEmail);

  if (configuredEmails.length > 0) {
    return [...new Set(configuredEmails)];
  }

  return DEFAULT_BOOTSTRAP_ADMIN_EMAILS;
}

// Centralized runtime configuration for future migration to non-Supabase providers.
export function getAppConfig(): AppConfig {
  return {
    deploymentFlavor: readEnumValue(process.env.NEXT_PUBLIC_TP_DEPLOYMENT_FLAVOR, ["default", "production-cn"] as const, "default"),
    appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() || null,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || null,
    authMode: readEnumValue(process.env.NEXT_PUBLIC_TP_AUTH_MODE, ["supabase", "custom-api"] as const, "supabase"),
    storageMode: readEnumValue(process.env.NEXT_PUBLIC_TP_STORAGE_MODE, ["supabase", "object-storage"] as const, "supabase"),
    demoModeEnabled: process.env.NEXT_PUBLIC_TP_ENABLE_DEMO_MODE === DEMO_MODE_FLAG,
    bootstrapAdminEmails: getBootstrapAdminEmailsFromEnv(),
    supabase: getSupabaseConfigFromEnv(),
  };
}

export function getBootstrapAdminEmails() {
  return getAppConfig().bootstrapAdminEmails;
}

export function getDeploymentFlavor() {
  return getAppConfig().deploymentFlavor;
}

export function getAppBaseUrl() {
  return getAppConfig().appBaseUrl;
}

export function getApiBaseUrl() {
  return getAppConfig().apiBaseUrl;
}

export function getAuthMode() {
  return getAppConfig().authMode;
}

export function getStorageMode() {
  return getAppConfig().storageMode;
}

export function isDemoModeEnabled() {
  return getAppConfig().demoModeEnabled;
}

export function isBootstrapAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getBootstrapAdminEmails().includes(normalizeEmail(email));
}

export function getSupabaseConfig() {
  return getAppConfig().supabase;
}
