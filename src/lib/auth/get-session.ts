import { cookies } from "next/headers";

import { ensureProfile, findProfileById } from "@/repositories/profile-repository";
import { resolveServerAuthIdentity } from "@/services/server-auth-service";
import type { AppRole, AppUserProfile, SessionUser, UserType } from "@/types/auth";
import type { ProfileSummary } from "@/types/domain";

const DEFAULT_MOCK_PROFILE: AppUserProfile = {
  id: "mock-user",
  email: "demo@teaching-platform.dev",
  fullName: "Demo Learner",
  displayName: "Demo",
  avatarUrl: null,
  role: "student",
  userType: "internal",
  gradeLevel: null,
  status: "active",
};

function normalizeRole(value: string | undefined): AppRole | null {
  if (value === "super_admin" || value === "teacher" || value === "student") {
    return value;
  }

  return null;
}

function normalizeUserType(value: string | undefined): UserType | null {
  if (value === "internal" || value === "external") {
    return value;
  }

  return null;
}

function isDynamicServerUsageError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

async function resolveMockProfile(): Promise<AppUserProfile> {
  const cookieStore = await cookies();
  const role = normalizeRole(cookieStore.get("tp-role")?.value) ?? DEFAULT_MOCK_PROFILE.role;
  const userType = normalizeUserType(cookieStore.get("tp-user-type")?.value) ?? DEFAULT_MOCK_PROFILE.userType;

  return {
    ...DEFAULT_MOCK_PROFILE,
    role,
    userType,
    fullName: role === "teacher" || role === "super_admin" ? "Demo Instructor" : DEFAULT_MOCK_PROFILE.fullName,
  };
}

function mapProfileSummaryToAppUserProfile(profile: ProfileSummary): AppUserProfile {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
    userType: profile.userType,
    gradeLevel: profile.gradeLevel,
    status: profile.status,
  };
}

export async function getSession(): Promise<SessionUser> {
  try {
    const authResolution = await resolveServerAuthIdentity();

    if (authResolution.kind === "demo") {
      return {
        isAuthenticated: true,
        isMock: true,
        profile: await resolveMockProfile(),
      };
    }

    if (authResolution.kind === "unauthenticated") {
      return {
        isAuthenticated: false,
        isMock: false,
        profile: null,
      };
    }

    const existingProfile = await findProfileById(authResolution.identity.id);

    if (existingProfile) {
      return {
        isAuthenticated: true,
        isMock: false,
        profile: mapProfileSummaryToAppUserProfile(existingProfile),
      };
    }

    const identity = authResolution.identity;
    let bootstrappedProfile: ProfileSummary;

    try {
      bootstrappedProfile = await ensureProfile({
        id: identity.id,
        email: identity.email ?? "user@example.com",
        fullName: typeof identity.metadata.full_name === "string" ? identity.metadata.full_name : "Platform User",
        displayName: typeof identity.metadata.display_name === "string" ? identity.metadata.display_name : null,
        avatarUrl: typeof identity.metadata.avatar_url === "string" ? identity.metadata.avatar_url : null,
        role: typeof identity.metadata.role === "string" ? normalizeRole(identity.metadata.role) ?? "student" : "student",
        userType: typeof identity.metadata.user_type === "string" ? normalizeUserType(identity.metadata.user_type) ?? "internal" : "internal",
        gradeLevel: typeof identity.metadata.grade_level === "string" ? identity.metadata.grade_level : null,
        status: "active",
      });
    } catch (error) {
      console.error("Failed to create or load the application profile.", error);
      bootstrappedProfile = {
        id: identity.id,
        email: identity.email ?? "user@example.com",
        fullName: typeof identity.metadata.full_name === "string" ? identity.metadata.full_name : "Platform User",
        displayName: typeof identity.metadata.display_name === "string" ? identity.metadata.display_name : null,
        avatarUrl: typeof identity.metadata.avatar_url === "string" ? identity.metadata.avatar_url : null,
        role: typeof identity.metadata.role === "string" ? normalizeRole(identity.metadata.role) ?? "student" : "student",
        userType: typeof identity.metadata.user_type === "string" ? normalizeUserType(identity.metadata.user_type) ?? "internal" : "internal",
        gradeLevel: typeof identity.metadata.grade_level === "string" ? identity.metadata.grade_level : null,
        status: "active" as const,
      };
    }

    return {
      isAuthenticated: true,
      isMock: false,
      profile: mapProfileSummaryToAppUserProfile(bootstrappedProfile),
    };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    console.error("Unexpected failure while resolving the session.", error);
    return {
      isAuthenticated: false,
      isMock: false,
      profile: null,
    };
  }
}
