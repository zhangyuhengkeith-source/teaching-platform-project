import { UserRound } from "lucide-react";

import { AdminUserTable } from "@/components/domain/admin-user-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ADMIN_USERS_EMAIL } from "@/lib/auth/admin-users-access";
import { listAllProfiles } from "@/lib/queries/profiles";

export default async function AdminUsersPage() {
  const users = await listAllProfiles();

  return (
    <div className="space-y-6">
      <PageHeader
        description={`Only ${ADMIN_USERS_EMAIL} can open this page and change user roles, user types, or account status.`}
        title="Manage Users"
      />
      {users.length > 0 ? (
        <AdminUserTable items={users} />
      ) : (
        <EmptyState
          description="No user profiles are available yet. New registered users will appear here after their first sign-in creates a profile row."
          icon={UserRound}
          title="No users yet"
        />
      )}
    </div>
  );
}
