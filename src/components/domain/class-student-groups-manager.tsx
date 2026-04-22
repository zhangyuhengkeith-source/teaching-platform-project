"use client";

import { useMemo, useState, useTransition } from "react";
import { Archive, CalendarClock, Eye, Pencil, PlusCircle, Trash2, UsersRound } from "lucide-react";

import { ClassManagementPageHeader } from "@/components/domain/class-management-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatInShanghai, toShanghaiDateTimeInputValue } from "@/lib/utils/timezone";
import { cn } from "@/lib/utils/cn";
import type { ClassGroupingRuleSummary, GroupDetail, ProfileSummary, SpaceSummary } from "@/types/domain";

type JoinFilter = "all" | "open" | "full" | "archived";

type StudentWithGroupState = ProfileSummary & {
  groupMember: {
    groupId: string;
    profileId: string;
    memberRole: "leader" | "member";
    status: string;
    groupName: string;
  } | null;
};

interface ClassStudentGroupsManagerProps {
  classSpace: SpaceSummary;
  initialGroups: GroupDetail[];
  initialRule: ClassGroupingRuleSummary | null;
  initialStudents: StudentWithGroupState[];
  isAdmin: boolean;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function createRandomSlugSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export function ClassStudentGroupsManager({
  classSpace,
  initialGroups,
  initialRule,
  initialStudents,
  isAdmin,
}: ClassStudentGroupsManagerProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [students, setStudents] = useState(initialStudents);
  const [rule, setRule] = useState(initialRule);
  const [filter, setFilter] = useState<JoinFilter>("all");
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const apiBase = `/api/admin/classes/${classSpace.id}/student-groups`;

  const visibleGroups = useMemo(() => {
    if (filter === "all") {
      return groups.filter((group) => group.status !== "archived");
    }
    if (filter === "archived") {
      return groups.filter((group) => group.status === "archived");
    }
    return groups.filter((group) => group.joinStatus === filter && group.status !== "archived");
  }, [filter, groups]);

  function runOperation(operation: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await operation();
      } catch (operationError) {
        setError(operationError instanceof Error ? operationError.message : "Request failed.");
      }
    });
  }

  async function reload(nextFilter = filter) {
    const response = await fetch(`${apiBase}?join_status=${nextFilter}`);
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    const body = (await response.json()) as {
      items: GroupDetail[];
      students: StudentWithGroupState[];
      rule: ClassGroupingRuleSummary | null;
    };
    setGroups(body.items);
    setStudents(body.students);
    setRule(body.rule);
  }

  async function createRule(formData: FormData) {
    const response = await fetch(`${apiBase}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_students_per_group: Number(formData.get("max_students_per_group") ?? 4),
        instructions: String(formData.get("instructions") ?? "").trim() || null,
        deadline: String(formData.get("deadline") ?? ""),
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const body = (await response.json()) as { item: ClassGroupingRuleSummary };
    setRule(body.item);
    setMessage("Grouping rule created.");
  }

  async function createGroup(formData: FormData) {
    const response = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        leader_profile_id: String(formData.get("leader_profile_id") ?? ""),
        project_summary: String(formData.get("project_summary") ?? "").trim() || null,
        status: "active",
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    await reload();
    setMessage("Group created.");
  }

  async function patchGroup(group: GroupDetail, patch: Record<string, unknown>, successMessage: string) {
    const response = await fetch(`${apiBase}/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    await reload();
    setSelectedGroup(null);
    setMessage(successMessage);
  }

  async function deleteGroup(group: GroupDetail) {
    const response = await fetch(`${apiBase}/${group.id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    await reload();
    setSelectedGroup(null);
    setMessage("Group deleted.");
  }

  async function moveMember(groupId: string, formData: FormData) {
    const response = await fetch(`${apiBase}/${groupId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: String(formData.get("profile_id") ?? ""),
        member_role: String(formData.get("member_role") ?? "member"),
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    await reload();
    setMessage(groupId === "no-group" ? "Student removed from group." : "Student moved.");
  }

  async function moveMemberByProfileId(groupId: string, profileId: string, memberRole: "leader" | "member" = "member") {
    const formData = new FormData();
    formData.set("profile_id", profileId);
    formData.set("member_role", memberRole);
    await moveMember(groupId, formData);
  }

  async function runAutoGroupNow() {
    const response = await fetch(`${apiBase}/auto-group`, { method: "POST" });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    const body = (await response.json()) as { ran: boolean; assigned: number; createdGroups: number };
    await reload();
    setMessage(body.ran ? `Auto grouping assigned ${body.assigned} student(s) and created ${body.createdGroups} group(s).` : "No auto grouping was due.");
  }

  const noGroupStudents = students.filter((student) => !student.groupMember);
  const activeStudents = students.filter((student) => student.status === "active");

  return (
    <div className="space-y-6">
      <ClassManagementPageHeader
        classSpace={classSpace}
        description="Manage class groups, grouping rules, and post-deadline manual adjustments."
        showBackToModules
        title="Student Groups"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-primary/20 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Grouping rule</h2>
              </div>
              {rule ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Max {rule.maxStudentsPerGroup} students per group · Deadline {formatInShanghai(rule.deadline)}</p>
                  <p>Status: {rule.autoGroupStatus}{rule.autoGroupedAt ? ` at ${formatInShanghai(rule.autoGroupedAt)}` : ""}</p>
                  {rule.instructions ? <p>{rule.instructions}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Create a grouping rule before the deadline to enable safe automatic grouping.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create grouping rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-lg">
                  <DialogTitle>Create grouping rule</DialogTitle>
                  <DialogDescription>Automatic grouping runs once after the deadline and will not overwrite later manual changes.</DialogDescription>
                  <form action={(formData) => runOperation(() => createRule(formData))} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="max-size">Max students per group</label>
                      <Input defaultValue={rule?.maxStudentsPerGroup ?? 4} id="max-size" min={1} max={30} name="max_students_per_group" type="number" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="deadline">Group deadline</label>
                      <Input defaultValue={toShanghaiDateTimeInputValue(rule?.deadline)} id="deadline" name="deadline" required type="datetime-local" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="instructions">Instructions</label>
                      <Textarea defaultValue={rule?.instructions ?? ""} id="instructions" name="instructions" />
                    </div>
                    <Button disabled={isPending} type="submit">{isPending ? "Saving..." : "Save rule"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button disabled={isPending || !rule} onClick={() => runOperation(runAutoGroupNow)} type="button" variant="outline">
                Run due auto-group
              </Button>
            </div>
          </div>
        </div>

        <SectionCard description={`${noGroupStudents.length} student(s) currently have no group.`} title="Class roster">
          <div className="max-h-48 space-y-2 overflow-auto">
            {activeStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active students found.</p>
            ) : (
              activeStudents.map((student) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm" key={student.id}>
                  <span>{student.fullName}</span>
                  <Badge variant={student.groupMember ? "primary" : "muted"}>{student.groupMember?.groupName ?? "No group"}</Badge>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button">
                <UsersRound className="mr-2 h-4 w-4" />
                Create group
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg">
              <DialogTitle>Create group</DialogTitle>
              <DialogDescription>The selected leader will be moved out of any other active group in this class.</DialogDescription>
              <form action={(formData) => runOperation(() => createGroup(formData))} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="group-name">Group name</label>
                  <Input id="group-name" name="name" required placeholder={`Group ${createRandomSlugSuffix()}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="leader">Group leader</label>
                  <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="leader" name="leader_profile_id" required>
                    <option value="">Select student</option>
                    {activeStudents.map((student) => (
                      <option key={student.id} value={student.id}>{student.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="summary">Instructions / notes</label>
                  <Textarea id="summary" name="project_summary" />
                </div>
                <Button disabled={isPending} type="submit">{isPending ? "Creating..." : "Create group"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <select
          className="flex h-10 rounded-xl border border-input bg-white px-3 py-2 text-sm"
          onChange={(event) => {
            const next = event.target.value as JoinFilter;
            setFilter(next);
            runOperation(() => reload(next));
          }}
          value={filter}
        >
          <option value="all">All current groups</option>
          <option value="open">Open groups</option>
          <option value="full">Full groups</option>
          {isAdmin ? <option value="archived">Archived groups</option> : null}
        </select>
      </div>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <SectionCard description={`${visibleGroups.length} group(s)`} title="Groups">
        {visibleGroups.length === 0 ? (
          <EmptyState
            description="Create groups manually or configure a grouping rule for automatic assignment."
            icon={UsersRound}
            title="No groups"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleGroups.map((group) => (
              <div className={cn("rounded-lg border bg-white p-4 shadow-sm", group.joinStatus === "full" ? "border-amber-200" : "border-border")} key={group.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">Leader: {group.leaderName ?? group.leaderProfileId}</p>
                  </div>
                  <Badge variant={group.joinStatus === "full" ? "warning" : "success"}>{group.joinStatus === "full" ? "Full" : "Open"}</Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>{group.memberCount ?? 0} member(s): {(group.memberNames ?? []).join(", ") || "No active members"}</p>
                  <p>Updated: {formatInShanghai(group.updatedAt, { hour: "2-digit", minute: undefined })}</p>
                  <p>Created: {formatInShanghai(group.createdAt, { hour: undefined, minute: undefined })}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => setSelectedGroup(group)} size="sm" type="button" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View / edit
                  </Button>
                  {group.status !== "archived" ? (
                    <Button disabled={isPending} onClick={() => runOperation(() => patchGroup(group, { status: "archived" }, "Group archived."))} size="sm" type="button" variant="outline">
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  ) : null}
                  {(group.status !== "archived" || isAdmin) ? (
                    <Button disabled={isPending} onClick={() => runOperation(() => deleteGroup(group))} size="sm" type="button" variant="ghost">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Dialog onOpenChange={(open) => !open && setSelectedGroup(null)} open={Boolean(selectedGroup)}>
        {selectedGroup ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg">
            <DialogTitle>{selectedGroup.name}</DialogTitle>
            <DialogDescription>Manual changes here do not trigger a second automatic regrouping.</DialogDescription>
            <form
              action={(formData) => runOperation(() => patchGroup(selectedGroup, {
                name: String(formData.get("name") ?? "").trim(),
                project_summary: String(formData.get("project_summary") ?? "").trim() || null,
                leader_profile_id: String(formData.get("leader_profile_id") ?? selectedGroup.leaderProfileId),
              }, "Group updated."))}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Group name</label>
                  <Input defaultValue={selectedGroup.name} name="name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Leader</label>
                  <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" defaultValue={selectedGroup.leaderProfileId} name="leader_profile_id">
                    {selectedGroup.members.filter((member) => member.status === "active").map((member) => (
                      <option key={member.profileId} value={member.profileId}>{member.profileName ?? member.profileId}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea defaultValue={selectedGroup.projectSummary ?? ""} name="project_summary" />
              </div>
              <Button disabled={isPending} type="submit">
                <Pencil className="mr-2 h-4 w-4" />
                Save group
              </Button>
            </form>

            <div className="space-y-3">
              <h3 className="font-medium">Members</h3>
              {selectedGroup.members.filter((member) => member.status === "active").map((member) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm" key={member.id}>
                  <div>
                    <p className="font-medium">{member.profileName ?? member.profileId}</p>
                    <p className="text-muted-foreground">{member.memberRole}</p>
                  </div>
                  <Button disabled={isPending} onClick={() => runOperation(() => moveMemberByProfileId("no-group", member.profileId))} size="sm" type="button" variant="outline">
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <form action={(formData) => runOperation(() => moveMember(selectedGroup.id, formData))} className="space-y-4 rounded-lg border border-border p-4">
              <h3 className="font-medium">Move/add student</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" name="profile_id" required>
                  <option value="">Select student</option>
                  {activeStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} {student.groupMember ? `(${student.groupMember.groupName})` : "(No group)"}
                    </option>
                  ))}
                </select>
                <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" name="member_role">
                  <option value="member">Member</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
              <Button disabled={isPending} type="submit">Move into this group</Button>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
