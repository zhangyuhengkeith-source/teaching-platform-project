"use server";

import { revalidatePath } from "next/cache";

import { isBootstrapAdminEmail } from "@/lib/config/app-config";
import { createElectiveSpace } from "@/lib/mutations/electives";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSpaceWriteErrorMessage } from "@/lib/server/actions/space-action-errors";
import { createElectiveSchema } from "@/lib/validations/electives";

export interface CreateElectiveActionResult {
  ok: boolean;
  error?: string;
}

export async function createElectiveAction(input: unknown) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { ok: false, error: "Supabase is not configured for this environment." } satisfies CreateElectiveActionResult;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: authError?.message ?? "You are not authenticated." } satisfies CreateElectiveActionResult;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { ok: false, error: profileError?.message ?? "Unable to load the current profile." } satisfies CreateElectiveActionResult;
    }

    const canWriteSpaces =
      profile.status === "active" &&
      (profile.role === "teacher" || profile.role === "super_admin" || isBootstrapAdminEmail(profile.email));

    if (!canWriteSpaces) {
      return {
        ok: false,
        error: "当前账号还没有选修课写入权限。请确认 public.profiles 中该账号的 status=active，且 role=teacher 或 super_admin。",
      } satisfies CreateElectiveActionResult;
    }

    const parsed = createElectiveSchema.parse(input);
    const writeClient = await createSupabaseServerWriteClient({ requireServiceRole: true });
    await createElectiveSpace(profile.id, parsed, writeClient ?? undefined);

    revalidatePath("/admin/electives");
    revalidatePath("/electives");

    return { ok: true } satisfies CreateElectiveActionResult;
  } catch (error) {
    console.error("Failed to create elective.", error);
    return {
      ok: false,
      error: getSpaceWriteErrorMessage(error, "create"),
    } satisfies CreateElectiveActionResult;
  }
}
