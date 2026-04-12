import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ElectiveForm } from "@/components/domain/elective-form";

export default function NewElectivePage() {
  return (
    <div className="space-y-6">
      <PageHeader description="Create a new elective space and define the group formation settings from the start." title="Create Elective" />
      <SectionCard description="Elective-specific group rules are managed here and can be adjusted later." title="Elective settings">
        <ElectiveForm mode="create" />
      </SectionCard>
    </div>
  );
}
