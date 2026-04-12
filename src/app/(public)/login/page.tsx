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
import { canUseDemoMode, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import { ROUTES } from "@/lib/constants/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
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

      setMessage("Demo mode is enabled. Continuing into the local shell.");
    }

    router.push(searchParams?.get("next") ?? ROUTES.dashboard);
  });

  return (
    <AuthLayout description="Sign in with a configured Supabase project. Demo mode must be explicitly enabled before local mock access is allowed." title="Welcome back">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" type="email" {...register("email")} />
          {formState.errors.email ? <p className="text-sm text-red-600">{formState.errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <Input id="password" type="password" {...register("password")} />
          {formState.errors.password ? <p className="text-sm text-red-600">{formState.errors.password.message}</p> : null}
        </div>
        {!supabase && !canUseDemoMode() ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{SUPABASE_CONFIG_ERROR}</p> : null}
        {message ? <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{message}</p> : null}
        <Button className="w-full" size="lg" type="submit">
          {formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-medium text-primary" href="/register">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLayout description="Preparing the sign-in flow." title="Welcome back"><div className="h-72" /></AuthLayout>}>
      <LoginForm />
    </Suspense>
  );
}
