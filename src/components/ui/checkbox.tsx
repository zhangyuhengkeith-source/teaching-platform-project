"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center", className)}>
      <input
        checked={checked}
        className="sr-only"
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        type="checkbox"
        {...props}
      />
      <span className={cn("flex h-4 w-4 items-center justify-center rounded border border-border bg-white", checked ? "bg-primary text-white" : "")}>
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
    </label>
  );
}

