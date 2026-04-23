"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, CalendarRange, Clock, UsersRound } from "lucide-react";

import {
  approveClassRequestAction,
  approveClassUpdateRequestAction,
  rejectClassRequestAction,
  rejectClassUpdateRequestAction,
} from "@/lib/server/actions/class-approval";
import { AdminClassRequestDialog } from "@/components/domain/admin-class-request-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils/format";
import { getClassManagementPath } from "@/lib/constants/class-management";
import type { AdminClassCardSummary } from "@/types/domain";

function ApprovalBadge({ status }: { status: AdminClassCardSummary["approvalStatus"] }) {
  if (status === "pending") {
    return <Badge variant="warning">Pending review</Badge>;
  }

  if (status === "rejected") {
    return <Badge variant="muted">Rejected</Badge>;
  }

  return <Badge variant="success">Approved</Badge>;
}

export function AdminClassHomeCard({ item, canApprove }: { item: AdminClassCardSummary; canApprove: boolean }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAwaitingReview = item.approvalStatus === "pending";
  const isRejected = item.approvalStatus === "rejected";
  const pendingUpdateRequest = item.pendingUpdateRequest ?? null;

  function runApproval(action: "approve" | "reject") {
    setMessage(null);
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveClassRequestAction({ classId: item.id })
          : await rejectClassRequestAction({ classId: item.id, reason });

      setMessage(result.ok ? (action === "approve" ? "Class approved." : "Class rejected.") : result.error ?? "Action failed.");
    });
  }

  function runUpdateApproval(action: "approve" | "reject") {
    if (!pendingUpdateRequest) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveClassUpdateRequestAction({ requestId: pendingUpdateRequest.id })
          : await rejectClassUpdateRequestAction({ requestId: pendingUpdateRequest.id, reason });

      setMessage(result.ok ? (action === "approve" ? "Class update approved." : "Class update rejected.") : result.error ?? "Action failed.");
    });
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-xl">{item.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{item.subjectLabel}</Badge>
              <ApprovalBadge status={item.approvalStatus ?? "approved"} />
            </div>
          </div>
          {item.academicYear ? (
            <div className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              {item.academicYear}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isAwaitingReview ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">This class is awaiting admin review.</p>
        ) : null}
        {isRejected ? (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            This class was rejected. Revise it from the create card and resubmit.
            {item.rejectionReason ? ` Reason: ${item.rejectionReason}` : ""}
          </p>
        ) : null}
        {pendingUpdateRequest ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">This class has a pending edit request.</p>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <p>New name: {pendingUpdateRequest.proposedTitle}</p>
              <p>New academic year: {pendingUpdateRequest.proposedAcademicYear ?? "-"}</p>
              <p>New status: {pendingUpdateRequest.proposedStatus}</p>
              <p>Submitted: {formatDateTime(pendingUpdateRequest.submittedAt)}</p>
            </div>
            <p className="text-xs">Before approval, the class keeps its current details and status.</p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Students</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
              <UsersRound className="h-4 w-4 text-primary" />
              {item.studentCount}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Teachers</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
              <UsersRound className="h-4 w-4 text-primary" />
              {item.teacherCount}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Latest resource update</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
            <Clock className="h-4 w-4 text-primary" />
            {item.latestResourceUpdatedAt ? formatDateTime(item.latestResourceUpdatedAt) : "No resources yet"}
          </p>
        </div>

        {canApprove && isAwaitingReview ? (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <Textarea
              disabled={isPending}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional rejection reason"
              value={reason}
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={isPending} onClick={() => runApproval("approve")} type="button">
                Approve
              </Button>
              <Button disabled={isPending} onClick={() => runApproval("reject")} type="button" variant="outline">
                Reject
              </Button>
            </div>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </div>
        ) : null}

        {canApprove && pendingUpdateRequest ? (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <Textarea
              disabled={isPending}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional rejection reason for this edit request"
              value={reason}
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={isPending} onClick={() => runUpdateApproval("approve")} type="button">
                Approve class edit
              </Button>
              <Button disabled={isPending} onClick={() => runUpdateApproval("reject")} type="button" variant="outline">
                Reject class edit
              </Button>
            </div>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </div>
        ) : null}

        {item.approvalStatus === "approved" ? (
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" href={getClassManagementPath(item.id)}>
            Manage class
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
        {isRejected ? (
          <AdminClassRequestDialog
            initialClass={item}
            trigger={
              <Button type="button" variant="outline">
                Revise and resubmit
              </Button>
            }
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
