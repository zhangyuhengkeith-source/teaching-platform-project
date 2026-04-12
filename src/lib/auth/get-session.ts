import { cookies } from "next/headers";

import { canUseDemoMode, isSupabaseConfigured } from "@/lib/config/runtime";
import { createProfileIfMissing } from "@/lib/mutations/profiles";
import { getProfileByUserId } from "@/lib/queries/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

export async function getSession(): Promise<SessionUser> {
  if (!isSupabaseConfigured()) {
    if (!canUseDemoMode()) {
      return {
        isAuthenticated: false,
        isMock: false,
        profile: null,
      };
    }

    return {
      isAuthenticated: true,
      isMock: true,
      profile: await resolveMockProfile(),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      isAuthenticated: true,
      isMock: true,
      profile: await resolveMockProfile(),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      isMock: false,
      profile: null,
    };
  }

  const existingProfile = await getProfileByUserId(user.id);

  if (existingProfile) {
    return {
      isAuthenticated: true,
      isMock: false,
      profile: {
        id: existingProfile.id,
        email: existingProfile.email,
        fullName: existingProfile.fullName,
        displayName: existingProfile.displayName,
        avatarUrl: existingProfile.avatarUrl,
        role: existingProfile.role,
        userType: existingProfile.userType,
        gradeLevel: existingProfile.gradeLevel,
        status: existingProfile.status,
      },
    };
  }

  let bootstrappedProfile: ProfileSummary;

  try {
    bootstrappedProfile = await createProfileIfMissing({
      id: user.id,
      email: user.email ?? "user@example.com",
      fullName: user.user_metadata.full_name ?? "Platform User",
      displayName: user.user_metadata.display_name ?? null,
      avatarUrl: user.user_metadata.avatar_url ?? null,
      role: normalizeRole(user.user_metadata.role) ?? "student",
      userType: normalizeUserType(user.user_metadata.user_type) ?? "internal",
      gradeLevel: user.user_metadata.grade_level ?? null,
      status: "active",
    });
  } catch {
    bootstrappedProfile = {
      id: user.id,
      email: user.email ?? "user@example.com",
      fullName: user.user_metadata.full_name ?? "Platform User",
      displayName: user.user_metadata.display_name ?? null,
      avatarUrl: user.user_metadata.avatar_url ?? null,
      role: normalizeRole(user.user_metadata.role) ?? "student",
      userType: normalizeUserType(user.user_metadata.user_type) ?? "internal",
      gradeLevel: user.user_metadata.grade_level ?? null,
      status: "active" as const,
    };
  }

  return {
    isAuthenticated: true,
    isMock: false,
    profile: {
      id: bootstrappedProfile.id,
      email: bootstrappedProfile.email,
      fullName: bootstrappedProfile.fullName,
      displayName: bootstrappedProfile.displayName,
      avatarUrl: bootstrappedProfile.avatarUrl,
      role: bootstrappedProfile.role,
      userType: bootstrappedProfile.userType,
      gradeLevel: bootstrappedProfile.gradeLevel,
      status: bootstrappedProfile.status,
    },
  };
}
