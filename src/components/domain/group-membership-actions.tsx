"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { joinGroupAction } from "@/lib/server/actions/join-group";
import { leaveGroupAction } from "@/lib/server/actions/leave-group";
import { removeGroupMemberAction } from "@/lib/server/actions/remove-group-member";

export function JoinGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              const result = await joinGroupAction({ group_id: groupId });
              if (!result.ok) {
                setError(result.error ?? t("admin.groupActions.actionFailed"));
                return;
              }
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : t("admin.groupActions.actionFailed"));
            }
          })
        }
        type="button"
      >
        {isPending ? t("admin.groupActions.joining") : t("admin.groupActions.join")}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              const result = await leaveGroupAction({ group_id: groupId });
              if (!result.ok) {
                setError(result.error ?? t("admin.groupActions.actionFailed"));
                return;
              }
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : t("admin.groupActions.actionFailed"));
            }
          })
        }
        type="button"
        variant="outline"
      >
        {isPending ? t("admin.groupActions.leaving") : t("admin.groupActions.leave")}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function RemoveGroupMemberButton({ groupId, profileId }: { groupId: string; profileId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              const result = await removeGroupMemberAction({ group_id: groupId, profile_id: profileId });
              if (!result.ok) {
                setError(result.error ?? t("admin.groupActions.actionFailed"));
                return;
              }
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : t("admin.groupActions.actionFailed"));
            }
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        {isPending ? t("admin.groupActions.removing") : t("admin.groupActions.remove")}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
