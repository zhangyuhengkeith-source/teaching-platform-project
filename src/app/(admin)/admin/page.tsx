import { GraduationCap } from "lucide-react";

import { AdminClassHomeCard } from "@/components/domain/admin-class-home-card";
import { AdminCreateClassCard } from "@/components/domain/admin-create-class-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";
import { isAdminRole } from "@/lib/permissions/profiles";
import { listAdminClassCards } from "@/lib/queries/admin-classes";

export default async function AdminPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const classes = await listAdminClassCards(profile);
  const canApprove = isAdminRole(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage classes from a single approval-centered workspace."
        title="Teacher Management"
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AdminCreateClassCard />
        {classes.map((item) => (
          <AdminClassHomeCard canApprove={canApprove} item={item} key={item.id} />
        ))}
      </section>

      {classes.length === 0 ? (
        <EmptyState
          description="No classes are available yet. Create a new class request to begin."
          icon={GraduationCap}
          title="No classes yet"
        />
      ) : null}
    </div>
  );
}
