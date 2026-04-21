"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_SUBJECTS, getClassSubjectFromSlug, getClassSubjectLabel } from "@/lib/constants/class-subjects";
import {
  createClassApprovalRequestAction,
  resubmitRejectedClassRequestAction,
} from "@/lib/server/actions/class-approval";
import {
  createClassFormSchema,
  type CreateClassFormSchema,
} from "@/lib/validations/class-space";
import type { AdminClassCardSummary } from "@/types/domain";

interface AdminClassRequestDialogProps {
  trigger: ReactNode;
  initialClass?: AdminClassCardSummary;
}

export function AdminClassRequestDialog({ trigger, initialClass }: AdminClassRequestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const mode = initialClass ? "resubmit" : "create";
  const form = useForm<CreateClassFormSchema>({
    resolver: zodResolver(createClassFormSchema),
    defaultValues: {
      title: initialClass?.title ?? "",
      subject: getClassSubjectFromSlug(initialClass?.slug) ?? undefined,
      description: initialClass?.description ?? "",
      academic_year: initialClass?.academicYear ?? "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (!open) {
      setMessage(null);
    }
  }, [open]);

  const onSubmit = form.handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createClassApprovalRequestAction(values)
          : await resubmitRejectedClassRequestAction({
              ...values,
              id: initialClass!.id,
            });

      if (!result.ok) {
        setMessage(result.error ?? "Unable to submit class request.");
        return;
      }

      setMessage(mode === "create" ? "Class request submitted for admin review." : "Class request resubmitted for admin review.");
      form.reset({
        title: "",
        subject: undefined,
        description: "",
        academic_year: "",
        status: "draft",
      });
      router.refresh();
    });
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-lg">
        <DialogTitle>{mode === "create" ? "Create New Class" : "Revise Class Request"}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Teacher-created classes are submitted to admin for approval."
            : "Update the class details and resubmit for admin review."}
        </DialogDescription>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="admin-class-title">Class name</label>
            <Input disabled={isPending} id="admin-class-title" {...form.register("title")} />
            {form.formState.errors.title ? <p className="text-sm text-red-600">{form.formState.errors.title.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-class-subject">Subject</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
                disabled={isPending}
                id="admin-class-subject"
                {...form.register("subject")}
              >
                <option value="">Select subject</option>
                {CLASS_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {getClassSubjectLabel(subject)}
                  </option>
                ))}
              </select>
              {form.formState.errors.subject ? <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-class-year">Academic year</label>
              <Input disabled={isPending} id="admin-class-year" placeholder="2025-2026" {...form.register("academic_year")} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="admin-class-description">Description</label>
            <Textarea disabled={isPending} id="admin-class-description" {...form.register("description")} />
          </div>

          {message ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p> : null}

          <div className="flex justify-end gap-2">
            <Button disabled={isPending} onClick={() => setOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Submitting..." : mode === "create" ? "Submit for review" : "Resubmit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
