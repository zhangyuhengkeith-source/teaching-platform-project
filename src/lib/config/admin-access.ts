import { getBootstrapAdminEmails as getConfiguredBootstrapAdminEmails, isBootstrapAdminEmail as isConfiguredBootstrapAdminEmail } from "@/lib/config/app-config";

export function getBootstrapAdminEmails() {
  return getConfiguredBootstrapAdminEmails();
}

export function isBootstrapAdminEmail(email: string | null | undefined) {
  return isConfiguredBootstrapAdminEmail(email);
}
