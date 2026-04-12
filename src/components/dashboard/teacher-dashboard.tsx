import { Button } from "@/components/ui/button";
import { teacherMetrics } from "@/lib/constants/mock-data";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";

export function TeacherDashboard() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          {teacherMetrics.map((item) => {
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
        <SectionCard description="A concise operations overview for the next teaching cycle." title="Recent notices">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-medium">Spring midterm rubric updated</p>
                <p className="text-sm text-muted-foreground">Shared with all writing groups today.</p>
              </div>
              <StatusBadge status="published" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-medium">Elective placement review</p>
                <p className="text-sm text-muted-foreground">Four students need approval before Friday.</p>
              </div>
              <StatusBadge status="pending" />
            </div>
          </div>
        </SectionCard>
      </div>
      <div className="space-y-6">
        <SectionCard description="Frequently used control points for teaching and service work." title="Quick admin actions">
          <div className="grid gap-3">
            <Button className="justify-start" variant="outline">Review essay queue</Button>
            <Button className="justify-start" variant="outline">Post a notice</Button>
            <Button className="justify-start" variant="outline">Adjust elective groups</Button>
          </div>
        </SectionCard>
        <SectionCard description="Immediate priorities surfaced from recent platform activity." title="Upcoming deadlines">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 p-4">Essay Order 241 needs commentary before 18:00 tomorrow.</li>
            <li className="rounded-xl bg-slate-50 p-4">Reading Seminar materials should be released by Thursday morning.</li>
            <li className="rounded-xl bg-slate-50 p-4">Elective confirmations for Debate Studio close in two days.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

