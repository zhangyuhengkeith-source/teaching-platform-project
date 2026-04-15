import { TranslationText } from "@/components/common/translation-text";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ClassForm } from "@/components/domain/class-form";

export default function NewClassPage() {
  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.classes.newDescription" />} title={<TranslationText translationKey="admin.classes.newTitle" />} />
      <SectionCard description={<TranslationText translationKey="admin.classes.newDetailsDescription" />} title={<TranslationText translationKey="admin.classes.detailsTitle" />}>
        <ClassForm mode="create" />
      </SectionCard>
    </div>
  );
}
