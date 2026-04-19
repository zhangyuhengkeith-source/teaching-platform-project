import Link from "next/link";
import { BellRing } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { AdminNoticeTable } from "@/components/domain/admin-notice-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/require-auth";
import { listManageableNoticeSpaces, listManageableNotices } from "@/lib/queries/notices";

export default async function AdminNoticesPage() {
  const profile = await requireAuth();
  const [notices, spaces] = await Promise.all([listManageableNotices(profile), listManageableNoticeSpaces(profile)]);
  const spaceTitles = Object.fromEntries(spaces.map((space) => [space.id, space.title]));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/admin/notices/new"><TranslationText translationKey="admin.notices.createAction" /></Link>
          </Button>
        }
        description={<TranslationText translationKey="admin.notices.description" />}
        title={<TranslationText translationKey="admin.notices.title" />}
      />
      <FilterBar>
        <SearchInput placeholderKey="admin.notices.searchPlaceholder" />
      </FilterBar>
      {notices.length > 0 ? (
        <AdminNoticeTable items={notices} spaceTitles={spaceTitles} />
      ) : (
        <EmptyState description={<TranslationText translationKey="admin.notices.emptyDescription" />} icon={BellRing} title={<TranslationText translationKey="admin.notices.emptyTitle" />} />
      )}
    </div>
  );
}
