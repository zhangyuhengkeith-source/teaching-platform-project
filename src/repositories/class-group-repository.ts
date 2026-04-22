import { mapClassGroupingRuleRow, mapGroupMemberRow, mapGroupRow } from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServerWriteClient } from "@/lib/supabase/admin";
import { nowInShanghaiIso } from "@/lib/utils/timezone";
import type {
  CreateClassGroupInput,
  CreateClassGroupingRuleInput,
  MoveClassGroupMemberInput,
  UpdateClassGroupInput,
} from "@/types/api";
import type { Database } from "@/types/database";
import type { ClassGroupingRuleSummary, GroupDetail, GroupMemberSummary, GroupSummary, ProfileSummary } from "@/types/domain";

type GroupActionType = "edited" | "archived" | "deleted";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || `group-${Date.now()}`;
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }
  return next;
}

function activeMembers(group: GroupDetail) {
  return group.members.filter((member) => member.status === "active");
}

function enrichJoinState(group: GroupDetail, maxGroupSize: number): GroupDetail {
  const members = activeMembers(group);
  return {
    ...group,
    memberCount: members.length,
    memberNames: members.map((member) => member.profileName ?? member.profileId),
    joinStatus: members.length >= maxGroupSize ? "full" : "open",
  };
}

async function listProfilesByIds(profileIds: string[]) {
  const ids = [...new Set(profileIds)].filter(Boolean);
  const supabase = await createSupabaseServerClient();

  if (!supabase || ids.length === 0) {
    return new Map<string, ProfileSummary>();
  }

  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error || !data) {
    return new Map<string, ProfileSummary>();
  }

  return new Map(
    data.map((profile) => [
      profile.id,
      {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        userType: profile.user_type,
        gradeLevel: profile.grade_level,
        status: profile.status,
      } satisfies ProfileSummary,
    ]),
  );
}

async function getClassStudentProfiles(classId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("space_memberships")
    .select("profile_id")
    .eq("space_id", classId)
    .eq("membership_role", "student")
    .eq("status", "active");

  if (error || !data) {
    return [];
  }

  const profileMap = await listProfilesByIds(data.map((membership) => membership.profile_id));
  return data
    .map((membership) => profileMap.get(membership.profile_id))
    .filter((profile): profile is ProfileSummary => Boolean(profile));
}

async function loadGroupDetails(classId: string, options: { includeArchived?: boolean } = {}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  let query = supabase.from("groups").select("*").eq("space_id", classId).neq("status", "deleted");
  if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data: groupRows, error } = await query.order("created_at", { ascending: false });
  if (error || !groupRows) {
    throw new Error(error?.message ?? "Failed to load groups.");
  }

  if (groupRows.length === 0) {
    return [];
  }

  const groupIds = groupRows.map((group) => group.id);
  const { data: memberRows, error: memberError } = await supabase
    .from("group_members")
    .select("*")
    .in("group_id", groupIds)
    .order("joined_at", { ascending: true });

  if (memberError || !memberRows) {
    throw new Error(memberError?.message ?? "Failed to load group members.");
  }

  const profileMap = await listProfilesByIds([
    ...memberRows.map((member) => member.profile_id),
    ...groupRows.map((group) => group.leader_profile_id),
  ]);

  const membersByGroupId = new Map<string, GroupMemberSummary[]>();
  for (const row of memberRows) {
    const member = mapGroupMemberRow(row);
    const profile = profileMap.get(member.profileId);
    const members = membersByGroupId.get(member.groupId) ?? [];
    members.push({
      ...member,
      profileName: profile?.fullName ?? profile?.displayName ?? null,
    });
    membersByGroupId.set(member.groupId, members);
  }

  return groupRows.map((row) => {
    const group = mapGroupRow(row);
    const leader = profileMap.get(group.leaderProfileId);
    return {
      ...group,
      leaderName: leader?.fullName ?? leader?.displayName ?? null,
      members: membersByGroupId.get(group.id) ?? [],
    } satisfies GroupDetail;
  });
}

export async function listClassGroupingRules(classId: string): Promise<ClassGroupingRuleSummary[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("class_grouping_rules")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load grouping rules.");
  }

  return data.map(mapClassGroupingRuleRow);
}

export async function getLatestClassGroupingRule(classId: string) {
  return (await listClassGroupingRules(classId))[0] ?? null;
}

export async function createClassGroupingRule(createdBy: string, classId: string, input: Omit<CreateClassGroupingRuleInput, "class_id">) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase) {
    throw new Error("Grouping rules require database writes.");
  }

  const { data, error } = await supabase
    .from("class_grouping_rules")
    .insert({
      class_id: classId,
      max_students_per_group: input.max_students_per_group,
      instructions: input.instructions ?? null,
      deadline: input.deadline,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create grouping rule.");
  }

  return mapClassGroupingRuleRow(data);
}

export async function listClassGroups(classId: string, options: { includeArchived?: boolean; joinStatus?: "open" | "full" | "all" } = {}) {
  const rule = await getLatestClassGroupingRule(classId);
  const maxGroupSize = rule?.maxStudentsPerGroup ?? 4;
  const groups = (await loadGroupDetails(classId, { includeArchived: options.includeArchived })).map((group) => enrichJoinState(group, maxGroupSize));

  if (!options.joinStatus || options.joinStatus === "all") {
    return groups;
  }

  return groups.filter((group) => group.joinStatus === options.joinStatus);
}

export async function getClassGroupById(classId: string, groupId: string) {
  return (await listClassGroups(classId, { includeArchived: true })).find((group) => group.id === groupId) ?? null;
}

export async function listClassStudentsWithGroupState(classId: string) {
  const [students, groups] = await Promise.all([
    getClassStudentProfiles(classId),
    listClassGroups(classId, { includeArchived: false }),
  ]);
  const activeMemberByProfileId = new Map<string, GroupMemberSummary & { groupName: string }>();

  for (const group of groups) {
    for (const member of activeMembers(group)) {
      activeMemberByProfileId.set(member.profileId, { ...member, groupName: group.name });
    }
  }

  return students.map((student) => ({
    ...student,
    groupMember: activeMemberByProfileId.get(student.id) ?? null,
  }));
}

async function notifyGroupMembers(classId: string, groupId: string, memberIds: string[], actionType: GroupActionType, groupName: string) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  const createdAt = nowInShanghaiIso();

  if (!supabase || memberIds.length === 0) {
    return;
  }

  const message =
    actionType === "archived"
      ? `Group "${groupName}" was archived.`
      : actionType === "deleted"
        ? `Group "${groupName}" was deleted.`
        : `Group "${groupName}" was updated.`;

  for (const userId of [...new Set(memberIds)]) {
    const { data: existing, error: existingError } = await supabase
      .from("content_change_notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("content_type", "student_group")
      .eq("content_id", groupId)
      .eq("is_read", false)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      const { error } = await supabase
        .from("content_change_notifications")
        .update({
          class_id: classId,
          action_type: actionType,
          message,
          created_at: createdAt,
        })
        .eq("id", existing.id);

      if (error) {
        throw new Error(error.message);
      }
      continue;
    }

    const { error } = await supabase.from("content_change_notifications").insert({
      user_id: userId,
      class_id: classId,
      content_type: "student_group",
      content_id: groupId,
      action_type: actionType,
      message,
      created_at: createdAt,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createClassGroup(profileId: string, classId: string, input: Omit<CreateClassGroupInput, "class_id">) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase) {
    throw new Error("Group creation requires database writes.");
  }

  await removeStudentFromActiveClassGroup(classId, input.leader_profile_id);

  const { data, error } = await supabase
    .from("groups")
    .insert({
      space_id: classId,
      name: input.name,
      slug: slugify(input.name),
      leader_profile_id: input.leader_profile_id,
      project_summary: input.project_summary ?? null,
      status: input.status ?? "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create group.");
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: data.id,
    space_id: classId,
    profile_id: input.leader_profile_id,
    member_role: "leader",
    status: "active",
  });

  if (memberError) {
    await supabase.from("groups").update({ status: "deleted", deleted_at: nowInShanghaiIso() }).eq("id", data.id);
    throw new Error(memberError.message);
  }

  return getClassGroupById(classId, data.id);
}

export async function updateClassGroup(classId: string, input: UpdateClassGroupInput) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase) {
    throw new Error("Group updates require database writes.");
  }

  const current = await getClassGroupById(classId, input.id);
  if (!current) {
    throw new Error("Group not found.");
  }

  const affectedStudentIds = activeMembers(current).map((member) => member.profileId);
  const { data, error } = await supabase
    .from("groups")
    .update({
      name: input.name,
      slug: input.name ? slugify(input.name) : undefined,
      leader_profile_id: input.leader_profile_id,
      project_summary: input.project_summary,
      status: input.status,
      archived_at: input.status === "archived" ? nowInShanghaiIso() : undefined,
      deleted_at: input.status === "deleted" ? nowInShanghaiIso() : undefined,
    })
    .eq("id", input.id)
    .eq("space_id", classId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update group.");
  }

  if (input.status === "archived" || input.status === "deleted") {
    await removeAllMembersFromGroup(classId, input.id);
    await notifyGroupMembers(classId, input.id, affectedStudentIds, input.status === "archived" ? "archived" : "deleted", current.name);
  } else {
    await notifyGroupMembers(classId, input.id, affectedStudentIds, "edited", input.name ?? current.name);
  }

  return getClassGroupById(classId, input.id);
}

export async function removeStudentFromActiveClassGroup(classId: string, profileId: string) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("group_members")
    .update({ status: "removed" })
    .eq("space_id", classId)
    .eq("profile_id", profileId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }
}

async function removeAllMembersFromGroup(classId: string, groupId: string) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("group_members")
    .update({ status: "removed" })
    .eq("space_id", classId)
    .eq("group_id", groupId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }
}

export async function moveClassGroupMember(classId: string, input: MoveClassGroupMemberInput) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase) {
    throw new Error("Member moves require database writes.");
  }

  const target = input.target_group_id ? await getClassGroupById(classId, input.target_group_id) : null;
  if (input.target_group_id && (!target || target.status === "archived" || target.status === "deleted")) {
    throw new Error("Target group is not available.");
  }

  const rule = await getLatestClassGroupingRule(classId);
  const maxGroupSize = rule?.maxStudentsPerGroup ?? 4;
  if (target && activeMembers(target).filter((member) => member.profileId !== input.profile_id).length >= maxGroupSize) {
    throw new Error("Target group is full.");
  }

  await removeStudentFromActiveClassGroup(classId, input.profile_id);

  if (target) {
    const { error } = await supabase.from("group_members").insert({
      group_id: target.id,
      space_id: classId,
      profile_id: input.profile_id,
      member_role: input.member_role ?? "member",
      status: "active",
    });

    if (error) {
      throw new Error(error.message);
    }

    if ((input.member_role ?? "member") === "leader") {
      await supabase.from("groups").update({ leader_profile_id: input.profile_id }).eq("id", target.id);
    }
  }

  return listClassGroups(classId, { includeArchived: false });
}

function nextRandomGroupName(existingNames: Set<string>) {
  if (!existingNames.has("Random Group")) {
    return "Random Group";
  }

  let index = 1;
  while (existingNames.has(`Random Group ${index}`)) {
    index += 1;
  }
  return `Random Group ${index}`;
}

async function createAutoGroup(classId: string, name: string, studentIds: string[]) {
  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase || studentIds.length === 0) {
    return null;
  }

  const leaderId = shuffle(studentIds)[0]!;
  const { data, error } = await supabase
    .from("groups")
    .insert({
      space_id: classId,
      name,
      slug: slugify(name),
      leader_profile_id: leaderId,
      status: "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create random group.");
  }

  const memberPayload: Database["public"]["Tables"]["group_members"]["Insert"][] = studentIds.map((profileId) => ({
      group_id: data.id,
      space_id: classId,
      profile_id: profileId,
      member_role: profileId === leaderId ? "leader" : "member",
      status: "active",
    }));

  const { error: memberError } = await supabase.from("group_members").insert(memberPayload);

  if (memberError) {
    throw new Error(memberError.message);
  }

  return data.id;
}

export async function ensureAutoGroupingForDueRule(classId: string) {
  const rule = await getLatestClassGroupingRule(classId);
  if (!rule || rule.autoGroupStatus === "completed" || new Date(rule.deadline).getTime() > Date.now()) {
    return { ran: false, assigned: 0, createdGroups: 0 };
  }

  const supabase = await createSupabaseServerWriteClient({ requireServiceRole: true });
  if (!supabase) {
    return { ran: false, assigned: 0, createdGroups: 0 };
  }

  const students = await getClassStudentProfiles(classId);
  const groups = await listClassGroups(classId, { includeArchived: false });
  const groupedStudentIds = new Set(groups.flatMap((group) => activeMembers(group).map((member) => member.profileId)));
  const ungroupedStudentIds = shuffle(students.map((student) => student.id).filter((studentId) => !groupedStudentIds.has(studentId)));
  let assigned = 0;
  let createdGroups = 0;

  for (const group of groups.filter((entry) => entry.status !== "locked")) {
    while (ungroupedStudentIds.length > 0 && activeMembers(group).length < rule.maxStudentsPerGroup) {
      const profileId = ungroupedStudentIds.shift()!;
      await moveClassGroupMember(classId, { profile_id: profileId, target_group_id: group.id });
      group.members.push({
        id: crypto.randomUUID(),
        groupId: group.id,
        spaceId: classId,
        profileId,
        memberRole: "member",
        joinedAt: nowInShanghaiIso(),
        status: "active",
      });
      assigned += 1;
    }
  }

  const existingNames = new Set(groups.map((group) => group.name));
  while (ungroupedStudentIds.length > 0) {
    const chunk = ungroupedStudentIds.splice(0, rule.maxStudentsPerGroup);
    const name = nextRandomGroupName(existingNames);
    existingNames.add(name);
    await createAutoGroup(classId, name, chunk);
    assigned += chunk.length;
    createdGroups += 1;
  }

  const { error } = await supabase
    .from("class_grouping_rules")
    .update({
      auto_group_status: "completed",
      auto_grouped_at: nowInShanghaiIso(),
    })
    .eq("id", rule.id)
    .eq("auto_group_status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  return { ran: true, assigned, createdGroups };
}
