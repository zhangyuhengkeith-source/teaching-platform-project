"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ContentChangeNotificationSummary } from "@/types/domain";

type LoadState = "idle" | "loading" | "empty" | "ready" | "error" | "success";

export function StudentChangeNotificationPopup({ enabled }: { enabled: boolean }) {
  const [notifications, setNotifications] = useState<ContentChangeNotificationSummary[]>([]);
  const [state, setState] = useState<LoadState>(enabled ? "loading" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const activeNotification = useMemo(() => notifications[0] ?? null, [notifications]);

  useEffect(() => {
    if (!enabled) {
      setState("idle");
      return;
    }

    let cancelled = false;

    async function loadNotifications() {
      setState("loading");
      setError(null);

      try {
        const response = await fetch("/api/student/change-notifications", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load change notifications.");
        }

        const payload = (await response.json()) as { notifications?: ContentChangeNotificationSummary[] };
        if (cancelled) {
          return;
        }

        const unread = payload.notifications ?? [];
        setNotifications(unread);
        setState(unread.length > 0 ? "ready" : "empty");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load change notifications.");
          setState("error");
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  async function confirmActiveNotification() {
    if (!activeNotification || isConfirming) {
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch("/api/student/change-notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [activeNotification.id] }),
      });

      if (!response.ok) {
        throw new Error("Failed to confirm notification.");
      }

      const nextNotifications = notifications.filter((notification) => notification.id !== activeNotification.id);
      setNotifications(nextNotifications);
      setState(nextNotifications.length > 0 ? "ready" : "success");
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Failed to confirm notification.");
      setState("error");
    } finally {
      setIsConfirming(false);
    }
  }

  if (!enabled || state === "idle" || state === "loading" || state === "empty" || state === "success") {
    return null;
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          void confirmActiveNotification();
        }
      }}
      open={Boolean(activeNotification)}
    >
      <DialogContent className="rounded-lg">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-1">
              <DialogTitle>内容变更提醒</DialogTitle>
              <DialogDescription>{error ?? activeNotification?.message}</DialogDescription>
            </div>
            <div className="flex justify-end">
              <Button disabled={isConfirming || !activeNotification} onClick={confirmActiveNotification} type="button">
                {isConfirming ? "确认中..." : "我知道了"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
