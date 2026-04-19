function normalizeGroupName(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "group";
}

export function generateGroupCode(profileId: string, groupName: string) {
  const profileToken = profileId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 12) || "member";
  const groupToken = normalizeGroupName(groupName).slice(0, 32);
  return `grp-${profileToken}-${groupToken}`;
}
