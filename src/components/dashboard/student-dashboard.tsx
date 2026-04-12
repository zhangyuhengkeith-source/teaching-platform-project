import { studentMetrics } from "@/lib/constants/mock-data";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {studentMetrics.map((item) => {
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
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <SectionCard description="Continue from your most relevant academic workflows." title="Continue learning">
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Advanced Composition · Week 5</p>
                <StatusBadge status="active" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Draft refinement checklist and sample annotations are ready.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Wrong-book revision block</p>
                <StatusBadge status="pending" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Review three sentence-structure issues flagged from your last submission.</p>
            </div>
          </div>
        </SectionCard>
        <SectionCard description="A quick view of campus-style updates and milestones." title="Latest notices">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 p-4">Reading Seminar will begin 15 minutes earlier this Thursday.</li>
            <li className="rounded-xl bg-slate-50 p-4">Elective registration confirmations will be published after the weekend.</li>
            <li className="rounded-xl bg-slate-50 p-4">Annotated feedback for the Week 4 essay set is now available.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

