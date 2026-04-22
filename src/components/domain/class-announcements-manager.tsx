"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, BellRing, CalendarClock, Edit3, Megaphone, Pin, PlusCircle, Trash2 } from "lucide-react";

import { ClassManagementPageHeader } from "@/components/domain/class-management-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createNoticeAction } from "@/lib/server/actions/create-notice";
import { deleteNoticeAction } from "@/lib/server/actions/delete-notice";
import { updateNoticeAction } from "@/lib/server/actions/update-notice";
import { formatDateTime, truncateText } from "@/lib/utils/format";
import { fromShanghaiDateTimeInputValue, toShanghaiDateTimeInputValue } from "@/lib/utils/timezone";
import type { NoticeStatus } from "@/lib/constants/statuses";
import type { NoticeType } from "@/types/database";
import type { NoticeSummary, SpaceSummary } from "@/types/domain";

const noticeTypes: Array<[NoticeType, string]> = [
  ["general", "General notice"],
  ["homework", "Homework"],
  ["deadline", "Deadline reminder"],
  ["mock_exam", "Mock exam"],
  ["grouping", "Grouping"],
  ["service_update", "Service update"],
];

const statuses: Array<[NoticeStatus, string]> = [
  ["draft", "Draft"],
  ["published", "Published"],
  ["archived", "Archived"],
];

interface ClassAnnouncementsManagerProps {
  classSpace: SpaceSummary;
  notices: NoticeSummary[];
  isAdmin: boolean;
}

type NoticeFilter = "active" | "draft" | "archived" | "all";

export function ClassAnnouncementsManager({ classSpace, notices, isAdmin }: ClassAnnouncementsManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<NoticeFilter>("active");

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      if (filter === "all") {
        return true;
      }

      if (filter === "active") {
        return notice.status === "published";
      }

      return notice.status === filter;
    });
  }, [filter, notices]);

  return (
    <div className="space-y-6">
      <ClassManagementPageHeader
        classSpace={classSpace}
        description="Manage class announcements, reminders, and scheduled notices."
        showBackToModules
        title="Class Announcements"
      />
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle>Announcements</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Create announcements for this class. The class is bound automatically from the current page.
            </p>
          </div>
          <AnnouncementDialog
            classId={classSpace.id}
            onSaved={() => router.refresh()}
            triggerLabel="Create announcement"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar>
            <div className="flex flex-wrap gap-2">
              {[
                ["active", "Published"],
                ["draft", "Drafts"],
                ...(isAdmin ? ([["archived", "Archived"], ["all", "All"]] as Array<[NoticeFilter, string]>) : []),
              ].map(([value, label]) => (
                <Button
                  key={value}
                  onClick={() => setFilter(value as NoticeFilter)}
                  size="sm"
                  type="button"
                  variant={filter === value ? "default" : "outline"}
                >
                  {label}
                </Button>
              ))}
            </div>
          </FilterBar>
          {filteredNotices.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredNotices.map((notice) => (
                <AnnouncementCard
                  classId={classSpace.id}
                  isAdmin={isAdmin}
                  key={notice.id}
                  notice={notice}
                  onChanged={() => router.refresh()}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              description="No announcements match the current view. Create a class announcement to start."
              icon={BellRing}
              title="No announcements"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnnouncementCard({
  classId,
  notice,
  isAdmin,
  onChanged,
}: {
  classId: string;
  notice: NoticeSummary;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const canArchive = notice.status !== "archived";
  const canDelete = notice.status !== "archived" || isAdmin;

  function updateStatus(status: NoticeStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateNoticeAction({
          id: notice.id,
          space_id: classId,
          status,
        });
        onChanged();
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Failed to update announcement.");
      }
    });
  }

  function deleteNotice() {
    if (!window.confirm("Delete this announcement? Students will be notified if it was visible to them.")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await deleteNoticeAction(notice.id);
        onChanged();
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Failed to delete announcement.");
      }
    });
  }

  return (
    <Card className={notice.status === "archived" ? "border-slate-200 bg-slate-50" : undefined}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-2">
              <CardTitle className="truncate text-base">{notice.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={notice.status} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{notice.noticeType}</span>
                {notice.isPinned ? (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Pin className="mr-1 h-3 w-3" />
                    Pinned
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{truncateText(notice.body, 180)}</p>
        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Publish: {formatDateTime(notice.publishAt)}
          </span>
          <span>Expire: {formatDateTime(notice.expireAt)}</span>
        </div>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <AnnouncementDialog
            classId={classId}
            initialNotice={notice}
            onSaved={onChanged}
            triggerLabel="Edit"
            triggerVariant="outline"
          />
          {canArchive ? (
            <Button disabled={isPending} onClick={() => updateStatus("archived")} size="sm" type="button" variant="outline">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          ) : null}
          {canDelete ? (
            <Button disabled={isPending} onClick={deleteNotice} size="sm" type="button" variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementDialog({
  classId,
  initialNotice,
  onSaved,
  triggerLabel,
  triggerVariant = "default",
}: {
  classId: string;
  initialNotice?: NoticeSummary;
  onSaved: () => void;
  triggerLabel: string;
  triggerVariant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(initialNotice?.isPinned ?? false);
  const mode = initialNotice ? "edit" : "create";

  function submit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const payload = {
      space_id: classId,
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      notice_type: String(formData.get("notice_type") ?? "general") as NoticeType,
      status: String(formData.get("status") ?? "draft") as NoticeStatus,
      publish_at: fromShanghaiDateTimeInputValue(String(formData.get("publish_at") ?? "")),
      expire_at: fromShanghaiDateTimeInputValue(String(formData.get("expire_at") ?? "")),
      is_pinned: isPinned,
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createNoticeAction(payload);
          setSuccess("Announcement created.");
        } else {
          if (!initialNotice) {
            throw new Error("Announcement not found.");
          }

          await updateNoticeAction({
            ...payload,
            id: initialNotice.id,
          });
          setSuccess("Announcement updated.");
        }

        onSaved();
        setOpen(false);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Failed to save announcement.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setError(null);
          setSuccess(null);
          setIsPinned(initialNotice?.isPinned ?? false);
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button size={triggerVariant === "outline" ? "sm" : "default"} type="button" variant={triggerVariant}>
          {mode === "edit" ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{mode === "create" ? "Create announcement" : "Edit announcement"}</DialogTitle>
        <DialogDescription>
          This announcement belongs to the current class automatically.
        </DialogDescription>
        <form action={submit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="announcement-title">Title</label>
              <Input
                defaultValue={initialNotice?.title ?? ""}
                id="announcement-title"
                name="title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="announcement-type">Type</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
                defaultValue={initialNotice?.noticeType ?? "general"}
                id="announcement-type"
                name="notice_type"
              >
                {noticeTypes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="announcement-body">Body</label>
            <Textarea
              defaultValue={initialNotice?.body ?? ""}
              id="announcement-body"
              name="body"
              required
              rows={5}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="announcement-status">Status</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
                defaultValue={initialNotice?.status ?? "draft"}
                id="announcement-status"
                name="status"
              >
                {statuses.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium">
              <Checkbox checked={isPinned} name="is_pinned" onCheckedChange={setIsPinned} />
              <span>Pin announcement</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="announcement-publish-at">Publish at</label>
              <Input
                defaultValue={toShanghaiDateTimeInputValue(initialNotice?.publishAt)}
                id="announcement-publish-at"
                name="publish_at"
                type="datetime-local"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="announcement-expire-at">Expire at</label>
              <Input
                defaultValue={toShanghaiDateTimeInputValue(initialNotice?.expireAt)}
                id="announcement-expire-at"
                name="expire_at"
                type="datetime-local"
              />
            </div>
          </div>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}
          <div className="flex justify-end gap-3">
            <Button disabled={isPending} onClick={() => setOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
