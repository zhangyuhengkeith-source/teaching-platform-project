import { Button } from "@/components/ui/button";
import { externalMetrics } from "@/lib/constants/mock-data";
import { SectionCard } from "@/components/shared/section-card";

export function ExternalDashboard() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          {externalMetrics.map((item) => {
            const Icon = item.icon;
            return (
              <SectionCard description={item.detail} key={item.label} title={item.label}>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-semibold">{item.value}</p>
                  <div className="rounded-xl bg-blue-50 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </section>
        <SectionCard description="The service entry point is positioned as a calm, guided workflow." title="New essay submission">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">Upload a draft, choose the level of commentary needed, and receive structured feedback with revision guidance.</p>
            <Button>Start a submission</Button>
          </div>
        </SectionCard>
      </div>
      <SectionCard description="Clear expectations help external clients prepare strong submissions." title="Service instructions">
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="rounded-xl bg-slate-50 p-4">Submit Word or PDF files with the essay prompt attached when possible.</li>
          <li className="rounded-xl bg-slate-50 p-4">Response windows can later be tiered by urgency and feedback depth.</li>
          <li className="rounded-xl bg-slate-50 p-4">A future order timeline will live here once Task 2 adds the data layer.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

