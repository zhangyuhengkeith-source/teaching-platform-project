"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { canUseDemoMode, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import { ROUTES } from "@/lib/constants/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginValues = {
  email: string;
  password: string;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { t } = useI18n();
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("forms.validation.validEmail")),
        password: z.string().min(8, t("forms.validation.passwordMin")),
      }),
    [t],
  );
  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
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

      setMessage(t("auth.demoLoginMessage"));
    }

    router.push(searchParams?.get("next") ?? ROUTES.dashboard);
  });

  return (
    <AuthLayout title={t("auth.loginTitle")}>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">{t("auth.email")}</label>
          <Input id="email" placeholder={t("auth.email")} type="email" {...register("email")} />
          {formState.errors.email ? <p className="text-sm text-red-600">{formState.errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">{t("auth.password")}</label>
          <Input id="password" placeholder={t("auth.password")} type="password" {...register("password")} />
          {formState.errors.password ? <p className="text-sm text-red-600">{formState.errors.password.message}</p> : null}
        </div>
        {!supabase && !canUseDemoMode() ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{SUPABASE_CONFIG_ERROR}</p> : null}
        {message ? <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{message}</p> : null}
        <Button className="w-full" size="lg" type="submit">
          {formState.isSubmitting ? t("auth.signInLoading") : t("auth.signIn")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link className="font-medium text-primary" href="/register">
            {t("auth.createAccount")}
          </Link>
        </p>
        <Button asChild className="w-full" size="lg" type="button" variant="outline">
          <Link href={ROUTES.home}>{t("auth.returnHome")}</Link>
        </Button>
      </form>
    </AuthLayout>
  );
}

function LoginFallback() {
  const { t } = useI18n();

  return <AuthLayout title={t("auth.loginTitle")}><div className="h-56" /></AuthLayout>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
