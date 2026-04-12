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
import { canUseDemoMode, SUPABASE_CONFIG_ERROR } from "@/lib/config/runtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { register, handleSubmit, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
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

      setMessage("Demo mode is enabled. Creating a persistent account is disabled in the local shell.");
    }

    router.push(ROUTES.dashboard);
  });

  return (
    <AuthLayout description="Create an account against a configured Supabase project. Demo mode must be explicitly enabled before local shell access is allowed." title="Create your account">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="fullName">Full name</label>
          <Input id="fullName" {...register("fullName")} />
          {formState.errors.fullName ? <p className="text-sm text-red-600">{formState.errors.fullName.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" type="email" {...register("email")} />
          {formState.errors.email ? <p className="text-sm text-red-600">{formState.errors.email.message}</p> : null}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <Input id="password" type="password" {...register("password")} />
            {formState.errors.password ? <p className="text-sm text-red-600">{formState.errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">Confirm password</label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
            {formState.errors.confirmPassword ? <p className="text-sm text-red-600">{formState.errors.confirmPassword.message}</p> : null}
          </div>
        </div>
        {!supabase && !canUseDemoMode() ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{SUPABASE_CONFIG_ERROR}</p> : null}
        {message ? <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{message}</p> : null}
        <Button className="w-full" size="lg" type="submit">
          {formState.isSubmitting ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-primary" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
