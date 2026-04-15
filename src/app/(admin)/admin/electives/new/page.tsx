import { TranslationText } from "@/components/common/translation-text";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ElectiveForm } from "@/components/domain/elective-form";

export default function NewElectivePage() {
  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.electives.newDescription" />} title={<TranslationText translationKey="admin.electives.newTitle" />} />
      <SectionCard description={<TranslationText translationKey="admin.electives.newSettingsDescription" />} title={<TranslationText translationKey="admin.electives.settingsTitle" />}>
        <ElectiveForm mode="create" />
      </SectionCard>
    </div>
  );
}
