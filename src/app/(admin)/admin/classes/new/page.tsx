import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ClassForm } from "@/components/domain/class-form";

export default function NewClassPage() {
  return (
    <div className="space-y-6">
      <PageHeader description="Create a new class space for structured teaching materials and notices." title="Create Class" />
      <SectionCard description="Only class-type spaces are created from this flow." title="Class details">
        <ClassForm mode="create" />
      </SectionCard>
    </div>
  );
}

