export type AppRole = "super_admin" | "teacher" | "student";
export type UserType = "internal" | "external";
export type ProfileStatus = "active" | "inactive" | "suspended";

export interface AppUserProfile {
  id: string;
  email: string;
  fullName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: AppRole;
  userType: UserType;
  gradeLevel?: string | null;
  status?: ProfileStatus;
}

export interface SessionUser {
  isAuthenticated: boolean;
  isMock: boolean;
  profile: AppUserProfile | null;
}
