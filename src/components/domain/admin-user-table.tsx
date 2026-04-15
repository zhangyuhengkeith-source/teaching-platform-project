"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { assignStudentToClassAction } from "@/lib/server/actions/assign-student-to-class";
import { updateProfileAccessAction } from "@/lib/server/actions/update-profile-access";
import type { ProfileSummary, SpaceSummary } from "@/types/domain";

type AdminUserRowData = ProfileSummary & {
  activeClassIds: string[];
  activeClassTitles: string[];
};

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
] as const;

const USER_TYPE_OPTIONS = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
] as const;

export function AdminUserTable({ items, classes }: { items: AdminUserRowData[]; classes: SpaceSummary[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">User Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned Classes</th>
              <th className="px-4 py-3 font-medium">Assign to Class</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <AdminUserRow classes={classes} item={item} key={item.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminUserRow({ item, classes }: { item: AdminUserRowData; classes: SpaceSummary[] }) {
  const [role, setRole] = useState<ProfileSummary["role"]>(item.role);
  const [userType, setUserType] = useState<ProfileSummary["userType"]>(item.userType);
  const [status, setStatus] = useState<ProfileSummary["status"]>(item.status);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canAssignClass = (role === "teacher" || (role === "student" && userType === "internal")) && classes.length > 0;

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{item.fullName}</div>
        <div className="text-xs text-slate-500">{item.id}</div>
      </td>
      <td className="px-4 py-3 text-slate-600">{item.email}</td>
      <td className="px-4 py-3">
        <select
          className="flex h-10 min-w-36 rounded-xl border border-input bg-white px-3 py-2 text-sm"
          disabled={isPending}
          onChange={(event) => setRole(event.target.value as ProfileSummary["role"])}
          value={role}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          className="flex h-10 min-w-32 rounded-xl border border-input bg-white px-3 py-2 text-sm"
          disabled={isPending}
          onChange={(event) => setUserType(event.target.value as ProfileSummary["userType"])}
          value={userType}
        >
          {USER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          className="flex h-10 min-w-32 rounded-xl border border-input bg-white px-3 py-2 text-sm"
          disabled={isPending}
          onChange={(event) => setStatus(event.target.value as ProfileSummary["status"])}
          value={status}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {item.activeClassTitles.length > 0 ? item.activeClassTitles.join(", ") : "Unassigned"}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <select
            className="flex h-10 min-w-44 rounded-xl border border-input bg-white px-3 py-2 text-sm"
            disabled={isPending || !canAssignClass}
            onChange={(event) => setSelectedClassId(event.target.value)}
            value={selectedClassId}
          >
            {classes.length === 0 ? <option value="">No classes available</option> : null}
            {classes.map((space) => (
              <option key={space.id} value={space.id}>
                {space.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <Button
              disabled={isPending || !canAssignClass || !selectedClassId}
              onClick={() => {
                setAssignmentMessage(null);
                startTransition(async () => {
                  try {
                    await assignStudentToClassAction({
                      profile_id: item.id,
                      space_id: selectedClassId,
                    });
                    setAssignmentMessage(role === "teacher" ? "Teacher assigned to class" : "Student assigned to class");
                  } catch (error) {
                    setAssignmentMessage(error instanceof Error ? error.message : "Assignment failed");
                  }
                });
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {isPending ? "Processing..." : "Assign"}
            </Button>
            {assignmentMessage ? <span className="text-xs text-slate-500">{assignmentMessage}</span> : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                try {
                  await updateProfileAccessAction({
                    id: item.id,
                    role,
                    user_type: userType,
                    status,
                  });
                  setMessage("Saved");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Save failed");
                }
              });
            }}
            size="sm"
            type="button"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
          {message ? <span className="text-xs text-slate-500">{message}</span> : null}
        </div>
      </td>
    </tr>
  );
}
