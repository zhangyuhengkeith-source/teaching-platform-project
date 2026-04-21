"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { signOutCurrentUser } from "@/services/auth-service";

export function AdminSignOutButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            try {
              await signOutCurrentUser();
              router.replace(ROUTES.login);
              router.refresh();
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Failed to log out.");
            }
          });
        }}
        type="button"
        variant="outline"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isPending ? "Logging out..." : "Logout"}
      </Button>
      {message ? <span className="text-sm text-red-600">{message}</span> : null}
    </div>
  );
}
