import { FilePenLine } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

export default function ServicePage() {
  return (
    <div className="space-y-6">
      <PageHeader description="This page is reserved for the external service workflow: order intake, progress states, and delivered feedback." title="Service" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard description="Prepared for future order tables and delivery history." title="Essay service overview">
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>The service module will support guided submission, order status visibility, and completed feedback archives.</p>
            <p>Task 2 can connect real Supabase order records without reshaping this page shell.</p>
          </div>
        </SectionCard>
        <SectionCard description="Immediate placeholder areas for future operational blocks." title="Order placeholders">
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">New order intake</div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Active review queue</div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Completed feedback delivery</div>
          </div>
        </SectionCard>
      </div>
      <SectionCard description="An example reusable empty/loading-state area for future datasets." title="Ready for order data">
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-white p-6">
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <FilePenLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">No active service orders connected yet</p>
            <p className="text-sm text-muted-foreground">This becomes a live client workbench once order tables and uploads are introduced.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
