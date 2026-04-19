"use server";

import { revalidatePath } from "next/cache";

import { createSpace } from "@/lib/mutations/spaces";
import { isBootstrapAdminEmail } from "@/lib/config/app-config";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSpaceSchema } from "@/lib/validations/spaces";
import type { CreateSpaceActionResult } from "@/lib/server/actions/create-space";
import { getSpaceWriteErrorMessage } from "@/lib/server/actions/space-action-errors";

export async function createManagedClassAction(input: unknown) {
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

    const canAccessAdminUsers =
      profile.status === "active" && (profile.role === "super_admin" || isBootstrapAdminEmail(profile.email));

    if (!canAccessAdminUsers) {
      return {
        ok: false,
        error: "当前账号没有超管权限，不能通过用户管理入口创建班级。",
      } satisfies CreateSpaceActionResult;
    }

    const parsed = createSpaceSchema.parse({
      ...(typeof input === "object" && input !== null ? input : {}),
      type: "class",
    });
    const writeClient = await createSupabaseServerWriteClient({ requireServiceRole: true });
    await createSpace(profile.id, parsed, writeClient ?? undefined);

    revalidatePath("/admin/users");
    revalidatePath("/admin/classes");
    revalidatePath("/classes");

    return { ok: true } satisfies CreateSpaceActionResult;
  } catch (error) {
    console.error("Failed to create managed class.", error);
    return {
      ok: false,
      error: getSpaceWriteErrorMessage(error, "create"),
    } satisfies CreateSpaceActionResult;
  }
}
