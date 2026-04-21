"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { assignStudentToClassAction } from "@/lib/server/actions/assign-student-to-class";
import { assignStudentToElectiveAction } from "@/lib/server/actions/assign-student-to-elective";
import { updateProfileAccessAction } from "@/lib/server/actions/update-profile-access";
import type { ProfileSummary, SpaceSummary } from "@/types/domain";

type AdminUserRowData = ProfileSummary & {
  activeClassIds: string[];
  activeClassTitles: string[];
  activeElectiveIds: string[];
  activeElectiveTitles: string[];
};

const ROLE_OPTIONS = [
  { value: "admin", labelKey: "profile.roles.admin" },
  { value: "super_admin", labelKey: "profile.roles.superAdmin" },
  { value: "teacher", labelKey: "profile.roles.teacher" },
  { value: "student", labelKey: "profile.roles.student" },
] as const;

const USER_TYPE_OPTIONS = [
  { value: "internal", labelKey: "profile.userTypes.internal" },
  { value: "external", labelKey: "profile.userTypes.external" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", labelKey: "admin.userTable.statuses.active" },
  { value: "inactive", labelKey: "admin.userTable.statuses.inactive" },
  { value: "suspended", labelKey: "admin.userTable.statuses.suspended" },
] as const;

export function AdminUserTable({ items, classes, electives }: { items: AdminUserRowData[]; classes: SpaceSummary[]; electives: SpaceSummary[] }) {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("admin.tables.name")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.email")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.role")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.userType")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.status")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.assignedClasses")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.assignToClass")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.assignedElectives")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.assignToElective")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.tables.action")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <AdminUserRow classes={classes} electives={electives} item={item} key={item.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminUserRow({ item, classes, electives }: { item: AdminUserRowData; classes: SpaceSummary[]; electives: SpaceSummary[] }) {
  const { t } = useI18n();
  const [role, setRole] = useState<ProfileSummary["role"]>(item.role);
  const [userType, setUserType] = useState<ProfileSummary["userType"]>(item.userType);
  const [status, setStatus] = useState<ProfileSummary["status"]>(item.status);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [selectedElectiveId, setSelectedElectiveId] = useState(electives[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [classAssignmentMessage, setClassAssignmentMessage] = useState<string | null>(null);
  const [electiveAssignmentMessage, setElectiveAssignmentMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canAssignClass = (role === "teacher" || (role === "student" && userType === "internal")) && classes.length > 0;
  const canAssignElective = (role === "teacher" || (role === "student" && userType === "internal")) && electives.length > 0;

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
              {t(option.labelKey)}
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
              {t(option.labelKey)}
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
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {item.activeClassTitles.length > 0 ? item.activeClassTitles.join(", ") : t("admin.tables.unassigned")}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <select
            className="flex h-10 min-w-44 rounded-xl border border-input bg-white px-3 py-2 text-sm"
            disabled={isPending || !canAssignClass}
            onChange={(event) => setSelectedClassId(event.target.value)}
            value={selectedClassId}
          >
            {classes.length === 0 ? <option value="">{t("admin.tables.noClassesAvailable")}</option> : null}
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
                setClassAssignmentMessage(null);
                startTransition(async () => {
                  try {
                    await assignStudentToClassAction({
                      profile_id: item.id,
                      space_id: selectedClassId,
                    });
                    setClassAssignmentMessage(role === "teacher" ? t("admin.userTable.teacherAssigned") : t("admin.userTable.studentAssigned"));
                  } catch (error) {
                    setClassAssignmentMessage(error instanceof Error ? error.message : t("admin.userTable.assignmentFailed"));
                  }
                });
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {isPending ? t("admin.userTable.processing") : t("admin.userTable.assign")}
            </Button>
            {classAssignmentMessage ? <span className="text-xs text-slate-500">{classAssignmentMessage}</span> : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {item.activeElectiveTitles.length > 0 ? item.activeElectiveTitles.join(", ") : t("admin.tables.unassigned")}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <select
            className="flex h-10 min-w-44 rounded-xl border border-input bg-white px-3 py-2 text-sm"
            disabled={isPending || !canAssignElective}
            onChange={(event) => setSelectedElectiveId(event.target.value)}
            value={selectedElectiveId}
          >
            {electives.length === 0 ? <option value="">{t("admin.tables.noElectivesAvailable")}</option> : null}
            {electives.map((space) => (
              <option key={space.id} value={space.id}>
                {space.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <Button
              disabled={isPending || !canAssignElective || !selectedElectiveId}
              onClick={() => {
                setElectiveAssignmentMessage(null);
                startTransition(async () => {
                  try {
                    await assignStudentToElectiveAction({
                      profile_id: item.id,
                      space_id: selectedElectiveId,
                    });
                    setElectiveAssignmentMessage(role === "teacher" ? t("admin.userTable.teacherAssignedToElective") : t("admin.userTable.studentAssignedToElective"));
                  } catch (error) {
                    setElectiveAssignmentMessage(error instanceof Error ? error.message : t("admin.userTable.electiveAssignmentFailed"));
                  }
                });
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {isPending ? t("admin.userTable.processing") : t("admin.userTable.assign")}
            </Button>
            {electiveAssignmentMessage ? <span className="text-xs text-slate-500">{electiveAssignmentMessage}</span> : null}
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
                  setMessage(t("admin.userTable.saved"));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
                }
              });
            }}
            size="sm"
            type="button"
          >
            {isPending ? t("admin.userTable.saving") : t("admin.userTable.save")}
          </Button>
          {message ? <span className="text-xs text-slate-500">{message}</span> : null}
        </div>
      </td>
    </tr>
  );
}
