"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { joinGroupAction } from "@/lib/server/actions/join-group";
import { leaveGroupAction } from "@/lib/server/actions/leave-group";
import { removeGroupMemberAction } from "@/lib/server/actions/remove-group-member";

const GROUP_ACTION_ERROR = "\u65e0\u6cd5\u5b8c\u6210\u5c0f\u7ec4\u64cd\u4f5c\u3002";

export function JoinGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
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
                setError(result.error ?? GROUP_ACTION_ERROR);
                return;
              }
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : GROUP_ACTION_ERROR);
            }
          })
        }
        type="button"
      >
        {isPending ? "\u52a0\u5165\u4e2d..." : "\u52a0\u5165\u5c0f\u7ec4"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
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
                setError(result.error ?? GROUP_ACTION_ERROR);
                return;
              }
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : GROUP_ACTION_ERROR);
            }
          })
        }
        type="button"
        variant="outline"
      >
        {isPending ? "\u9000\u51fa\u4e2d..." : "\u9000\u51fa\u5c0f\u7ec4"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function RemoveGroupMemberButton({ groupId, profileId }: { groupId: string; profileId: string }) {
  const router = useRouter();
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
                setError(result.error ?? GROUP_ACTION_ERROR);
                return;
              }
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : GROUP_ACTION_ERROR);
            }
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        {isPending ? "\u79fb\u9664\u4e2d..." : "\u79fb\u9664\u6210\u5458"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
