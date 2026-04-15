"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-border bg-white p-6 shadow-[0_32px_80px_rgba(15,23,42,0.18)] sm:p-8",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
