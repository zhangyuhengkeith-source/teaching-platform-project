export const RLS_REQUIRED_TABLES = [
  "profiles",
  "teacher_profiles",
  "student_profiles",
  "spaces",
  "space_memberships",
  "space_sections",
  "resources",
  "resource_files",
  "notices",
] as const;

export const RLS_POLICY_INTENT = {
  defaultMode: "deny",
  profileAccess: "Users manage their own profile unless elevated role applies.",
  spaceAccess: "Teachers manage owned/taught spaces; internal students read active-member spaces; external students do not access internal spaces.",
  resourceAccess: "Public only when visibility is explicit; otherwise membership-based.",
  noticeAccess: "Published notices follow space access; drafts remain management-only.",
  storageAccess: "Protected buckets use signed URLs plus mirrored ownership/membership rules.",
} as const;

