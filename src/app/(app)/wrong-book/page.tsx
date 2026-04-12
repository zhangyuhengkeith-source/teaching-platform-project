import { NotebookPen } from "lucide-react";

import { WrongBookItemCard } from "@/components/domain/wrong-book-item-card";
import { WrongBookRetryPanel } from "@/components/domain/wrong-book-retry-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SectionCard } from "@/components/shared/section-card";
import { requireClassViewer } from "@/lib/auth/require-class-access";
import { listActiveWrongBookItemsForUser, listMasteredWrongBookItemsForUser } from "@/lib/queries/exercises";

export default async function WrongBookPage() {
  const profile = await requireClassViewer();
  const [activeItems, masteredItems] = await Promise.all([
    listActiveWrongBookItemsForUser(profile),
    listMasteredWrongBookItemsForUser(profile),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review recent mistakes, retry key items, and keep your revision loop focused on what still needs repair."
        title="Wrong Book"
      />
      <FilterBar>
        <SearchInput placeholder="Search wrong-book items" />
      </FilterBar>
      <SectionCard description="Active items stay here until a successful retry marks them mastered." title="Active review items">
        {activeItems.length > 0 ? (
          <div className="space-y-4">
            {activeItems.map((item) => (
              <WrongBookItemCard actions={<WrongBookRetryPanel item={item} />} item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="You do not have any active wrong-book items right now. New incorrect MCQ and term-recall answers will appear here."
            icon={NotebookPen}
            title="No active wrong-book items"
          />
        )}
      </SectionCard>
      <SectionCard description="Mastered items remain visible for review history." title="Mastered items">
        {masteredItems.length > 0 ? (
          <div className="space-y-4">
            {masteredItems.map((item) => (
              <WrongBookItemCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <EmptyState description="Mastered items will appear here after successful retries." icon={NotebookPen} title="No mastered items yet" />
        )}
      </SectionCard>
    </div>
  );
}
