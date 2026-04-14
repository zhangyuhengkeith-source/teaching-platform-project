"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { redirectAfterLogin } from "@/lib/auth/redirect-after-login";
import { canUseDemoMode, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import { ROUTES } from "@/lib/constants/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserType } from "@/types/auth";

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountType: "internal_student" | "external_student";
};

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { t } = useI18n();
  const registerSchema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().min(2, t("forms.validation.fullNameMin")),
          email: z.string().email(t("forms.validation.validEmail")),
          password: z.string().min(8, t("forms.validation.passwordMin")),
          confirmPassword: z.string().min(8, t("forms.validation.confirmPasswordMin")),
          accountType: z.enum(["internal_student", "external_student"], {
            message: "Please select your account identity.",
          }),
        })
        .refine((values) => values.password === values.confirmPassword, {
          message: t("forms.validation.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );
  const { register, handleSubmit, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const userType: UserType = values.accountType === "external_student" ? "external" : "internal";

    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: "student",
            user_type: userType,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      if (!canUseDemoMode()) {
        setMessage(SUPABASE_CONFIG_ERROR);
        return;
      }

      setMessage(t("auth.demoRegisterMessage"));
    }

    router.push(
      redirectAfterLogin({
        id: "pending-registration",
        email: values.email,
        fullName: values.fullName,
        role: "student",
        userType,
      }),
    );
  });

  return (
    <AuthLayout description={t("auth.registerSubtitle")} title={t("auth.registerTitle")}>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="fullName">{t("auth.fullName")}</label>
          <Input id="fullName" placeholder={t("auth.fullName")} {...register("fullName")} />
          {formState.errors.fullName ? <p className="text-sm text-red-600">{formState.errors.fullName.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">{t("auth.email")}</label>
          <Input id="email" placeholder={t("auth.email")} type="email" {...register("email")} />
          {formState.errors.email ? <p className="text-sm text-red-600">{formState.errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="accountType">{t("auth.accountIdentity")}</label>
          <select
            className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
            defaultValue=""
            id="accountType"
            {...register("accountType")}
          >
            <option disabled value="">
              {t("auth.selectIdentity")}
            </option>
            <option value="internal_student">{t("profile.userTypes.internal")}</option>
            <option value="external_student">{t("profile.userTypes.external")}</option>
          </select>
          {formState.errors.accountType ? <p className="text-sm text-red-600">{formState.errors.accountType.message}</p> : null}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">{t("auth.password")}</label>
            <Input id="password" placeholder={t("auth.password")} type="password" {...register("password")} />
            {formState.errors.password ? <p className="text-sm text-red-600">{formState.errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">{t("auth.confirmPassword")}</label>
            <Input id="confirmPassword" placeholder={t("auth.confirmPassword")} type="password" {...register("confirmPassword")} />
            {formState.errors.confirmPassword ? <p className="text-sm text-red-600">{formState.errors.confirmPassword.message}</p> : null}
          </div>
        </div>
        {!supabase && !canUseDemoMode() ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{SUPABASE_CONFIG_ERROR}</p> : null}
        {message ? <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{message}</p> : null}
        <Button className="w-full" size="lg" type="submit">
          {formState.isSubmitting ? t("auth.signUpLoading") : t("auth.signUp")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link className="font-medium text-primary" href="/login">
            {t("auth.signIn")}
          </Link>
        </p>
        <Button asChild className="w-full" size="lg" type="button" variant="outline">
          <Link href={ROUTES.home}>{t("auth.returnHome")}</Link>
        </Button>
      </form>
    </AuthLayout>
  );
}
