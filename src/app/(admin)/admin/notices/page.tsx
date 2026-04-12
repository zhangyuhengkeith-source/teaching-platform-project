import Link from "next/link";
import { BellRing } from "lucide-react";

import { AdminNoticeTable } from "@/components/domain/admin-notice-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/require-auth";
import { listManageableNotices } from "@/lib/queries/notices";
import { listManageableClasses } from "@/lib/queries/spaces";

export default async function AdminNoticesPage() {
  const profile = await requireAuth();
  const [notices, spaces] = await Promise.all([listManageableNotices(profile), listManageableClasses(profile)]);
  const spaceTitles = Object.fromEntries(spaces.map((space) => [space.id, space.title]));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/admin/notices/new">Create notice</Link>
          </Button>
        }
        description="Publish homework reminders, deadlines, and class updates for active teaching spaces."
        title="Manage Notices"
      />
      <FilterBar>
        <SearchInput placeholder="Search notices" />
      </FilterBar>
      {notices.length > 0 ? (
        <AdminNoticeTable items={notices} spaceTitles={spaceTitles} />
      ) : (
        <EmptyState description="No notices have been created yet. Publish a notice to support the first class workflow." icon={BellRing} title="No notices yet" />
      )}
    </div>
  );
}

