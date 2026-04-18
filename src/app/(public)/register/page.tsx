"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { canUseDemoMode, isSupabaseConfigured, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import { ROUTES } from "@/lib/constants/routes";
import { signUpWithPassword } from "@/services/auth-service";

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [activationEmail, setActivationEmail] = useState<string | null>(null);
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const { t } = useI18n();
  const isAuthConfigured = isSupabaseConfigured();
  const registerSchema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().min(2, t("forms.validation.fullNameMin")),
          email: z.string().email(t("forms.validation.validEmail")),
          password: z.string().min(8, t("forms.validation.passwordMin")),
          confirmPassword: z.string().min(8, t("forms.validation.confirmPasswordMin")),
        })
        .refine((values) => values.password === values.confirmPassword, {
          message: t("forms.validation.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );
  const { register, handleSubmit, formState, reset } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);

    try {
      const result = await signUpWithPassword({
        email: values.email,
        password: values.password,
        metadata: {
          full_name: values.fullName,
          role: "student",
          user_type: "internal",
        },
      });

      if (result.mode === "demo") {
        setMessage(t("auth.demoRegisterMessage"));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : SUPABASE_CONFIG_ERROR);
      return;
    }

    setActivationEmail(values.email);
    setActivationDialogOpen(true);
    reset({
      fullName: values.fullName,
      email: values.email,
      password: "",
      confirmPassword: "",
    });
  });

  return (
    <>
      <AuthLayout title={t("auth.registerTitle")}>
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
          {!isAuthConfigured && !canUseDemoMode() ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{SUPABASE_CONFIG_ERROR}</p> : null}
          {message ? <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{message}</p> : null}
          <Button className="w-full" size="lg" type="submit">
            {formState.isSubmitting ? t("auth.signUpLoading") : t("auth.signUp")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link className="font-medium text-primary" href={ROUTES.login}>
              {t("auth.signIn")}
            </Link>
          </p>
          <Button asChild className="w-full" size="lg" type="button" variant="outline">
            <Link href={ROUTES.home}>{t("auth.returnHome")}</Link>
          </Button>
        </form>
      </AuthLayout>

      <Dialog onOpenChange={setActivationDialogOpen} open={activationDialogOpen}>
        <DialogContent className="overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <MailCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{t("auth.activationEyebrow")}</p>
                <DialogTitle className="text-2xl font-semibold leading-tight text-slate-950">
                  {t("auth.activationDialogTitle")}
                </DialogTitle>
                <DialogDescription className="text-sm leading-7 text-slate-600">
                  {t("auth.activationDialogDescription")}
                </DialogDescription>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t("auth.activationSentToLabel")}</p>
              <p className="mt-3 break-all text-base font-medium text-slate-900">{activationEmail}</p>
            </div>

            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-5 text-sm leading-7 text-amber-900">
              <p className="font-medium text-amber-950">{t("auth.activationTipTitle")}</p>
              <p className="mt-2">{t("auth.activationTipBody")}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1" size="lg">
                <Link href={ROUTES.login}>{t("auth.activationPrimaryAction")}</Link>
              </Button>
              <Button className="flex-1" onClick={() => setActivationDialogOpen(false)} size="lg" type="button" variant="outline">
                {t("auth.activationSecondaryAction")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
