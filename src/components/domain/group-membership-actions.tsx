"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { joinGroupAction } from "@/lib/server/actions/join-group";
import { leaveGroupAction } from "@/lib/server/actions/leave-group";
import { removeGroupMemberAction } from "@/lib/server/actions/remove-group-member";

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
              await joinGroupAction({ group_id: groupId });
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : "Unable to join group.");
            }
          })
        }
        type="button"
      >
        {isPending ? "Joining..." : "Join group"}
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
              await leaveGroupAction({ group_id: groupId });
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : "Unable to leave group.");
            }
          })
        }
        type="button"
        variant="outline"
      >
        {isPending ? "Leaving..." : "Leave group"}
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
              await removeGroupMemberAction({ group_id: groupId, profile_id: profileId });
              router.refresh();
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : "Unable to remove member.");
            }
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        {isPending ? "Removing..." : "Remove"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
