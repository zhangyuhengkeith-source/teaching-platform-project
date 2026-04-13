import { NotebookPen } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
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
        description={<TranslationText translationKey="wrongBook.description" />}
        title={<TranslationText translationKey="wrongBook.title" />}
      />
      <FilterBar>
        <SearchInput placeholderKey="wrongBook.searchPlaceholder" />
      </FilterBar>
      <SectionCard description={<TranslationText translationKey="wrongBook.activeDescription" />} title={<TranslationText translationKey="wrongBook.activeTitle" />}>
        {activeItems.length > 0 ? (
          <div className="space-y-4">
            {activeItems.map((item) => (
              <WrongBookItemCard actions={<WrongBookRetryPanel item={item} />} item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            description={<TranslationText translationKey="wrongBook.noActiveDescription" />}
            icon={NotebookPen}
            title={<TranslationText translationKey="wrongBook.noActiveTitle" />}
          />
        )}
      </SectionCard>
      <SectionCard description={<TranslationText translationKey="wrongBook.masteredDescription" />} title={<TranslationText translationKey="wrongBook.masteredTitle" />}>
        {masteredItems.length > 0 ? (
          <div className="space-y-4">
            {masteredItems.map((item) => (
              <WrongBookItemCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <EmptyState description={<TranslationText translationKey="wrongBook.noMasteredDescription" />} icon={NotebookPen} title={<TranslationText translationKey="wrongBook.noMasteredTitle" />} />
        )}
      </SectionCard>
    </div>
  );
}
