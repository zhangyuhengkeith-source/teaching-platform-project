"use client";

import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function ClassManagementError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      action={
        <Button onClick={reset} type="button">
          Retry
        </Button>
      }
      description={error.message || "Unable to load this class management page."}
      icon={AlertTriangle}
      title="Class page unavailable"
    />
  );
}
