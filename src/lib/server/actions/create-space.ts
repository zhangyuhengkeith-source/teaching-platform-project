"use server";

import { revalidatePath } from "next/cache";

import { createSpace } from "@/lib/mutations/spaces";
import { isBootstrapAdminEmail } from "@/lib/config/app-config";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSpaceSchema } from "@/lib/validations/spaces";
import { getSpaceWriteErrorMessage } from "@/lib/server/actions/space-action-errors";

export interface CreateSpaceActionResult {
  ok: boolean;
  error?: string;
}

export async function createSpaceAction(input: unknown) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { ok: false, error: "Supabase is not configured for this environment." } satisfies CreateSpaceActionResult;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: authError?.message ?? "You are not authenticated." } satisfies CreateSpaceActionResult;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { ok: false, error: profileError?.message ?? "Unable to load the current profile." } satisfies CreateSpaceActionResult;
    }

    const canWriteSpaces =
      profile.status === "active" &&
      (profile.role === "teacher" || profile.role === "super_admin" || isBootstrapAdminEmail(profile.email));

    if (!canWriteSpaces) {
      return {
        ok: false,
        error: "当前账号还没有班级写入权限。请确认 public.profiles 中该账号的 status=active，且 role=teacher 或 super_admin。",
      } satisfies CreateSpaceActionResult;
    }

    const parsed = createSpaceSchema.parse(input);
    const writeClient = await createSupabaseServerWriteClient({ requireServiceRole: true });
    await createSpace(profile.id, parsed, writeClient ?? undefined);
    revalidatePath("/admin/classes");
    revalidatePath("/classes");
    return { ok: true } satisfies CreateSpaceActionResult;
  } catch (error) {
    console.error("Failed to create space.", error);
    return {
      ok: false,
      error: getSpaceWriteErrorMessage(error, "create"),
    } satisfies CreateSpaceActionResult;
  }
}
