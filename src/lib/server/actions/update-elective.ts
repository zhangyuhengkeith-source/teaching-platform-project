"use server";

import { revalidatePath } from "next/cache";

import { isBootstrapAdminEmail } from "@/lib/config/app-config";
import { updateElectiveSpace } from "@/lib/mutations/electives";
import { getManageableElectiveById } from "@/lib/queries/electives";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSpaceWriteErrorMessage } from "@/lib/server/actions/space-action-errors";
import { updateElectiveSchema } from "@/lib/validations/electives";

export interface UpdateElectiveActionResult {
  ok: boolean;
  error?: string;
}

export async function updateElectiveAction(input: unknown) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { ok: false, error: "Supabase is not configured for this environment." } satisfies UpdateElectiveActionResult;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: authError?.message ?? "You are not authenticated." } satisfies UpdateElectiveActionResult;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { ok: false, error: profileError?.message ?? "Unable to load the current profile." } satisfies UpdateElectiveActionResult;
    }

    const canWriteSpaces =
      profile.status === "active" &&
      (profile.role === "teacher" || profile.role === "super_admin" || isBootstrapAdminEmail(profile.email));

    if (!canWriteSpaces) {
      return {
        ok: false,
        error: "当前账号还没有选修课写入权限。请确认 public.profiles 中该账号的 status=active，且 role=teacher 或 super_admin。",
      } satisfies UpdateElectiveActionResult;
    }

    const parsed = updateElectiveSchema.parse(input);
    const existing = await getManageableElectiveById(parsed.id, {
      id: profile.id,
      email: profile.email,
      fullName: "",
      role: profile.role,
      userType: "internal",
      status: profile.status,
    });

    if (!existing) {
      return { ok: false, error: "Elective not found or not manageable." } satisfies UpdateElectiveActionResult;
    }

    const writeClient = await createSupabaseServerWriteClient({ requireServiceRole: true });
    const updated = await updateElectiveSpace(parsed, writeClient ?? undefined);
    revalidatePath("/admin/electives");
    revalidatePath(`/admin/electives/${updated.id}/edit`);
    revalidatePath("/electives");
    revalidatePath(`/electives/${existing.slug}`);
    revalidatePath(`/electives/${updated.slug}`);

    return { ok: true } satisfies UpdateElectiveActionResult;
  } catch (error) {
    console.error("Failed to update elective.", error);
    return {
      ok: false,
      error: getSpaceWriteErrorMessage(error, "update"),
    } satisfies UpdateElectiveActionResult;
  }
}
