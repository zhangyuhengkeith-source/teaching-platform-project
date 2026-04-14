"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function WaitingAssignmentSignOutButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        onClick={() => {
          setMessage(null);

          startTransition(async () => {
            try {
              const supabase = createSupabaseBrowserClient();

              if (supabase) {
                const { error } = await supabase.auth.signOut();

                if (error) {
                  throw error;
                }
              }

              router.replace(ROUTES.login);
              router.refresh();
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "退出登录失败，请稍后重试。");
            }
          });
        }}
        size="lg"
        type="button"
        variant="outline"
      >
        {isPending ? "正在退出登录..." : "退出登录"}
      </Button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
