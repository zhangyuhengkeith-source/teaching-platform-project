import { BarChart3, Bell, FilePenLine, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

const stats = [
  { label: "Pending workflows", value: "18", icon: FilePenLine },
  { label: "Active users", value: "126", icon: Users },
  { label: "Unpublished notices", value: "3", icon: Bell },
  { label: "Weekly completion", value: "84%", icon: BarChart3 },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader description="An operations-oriented shell for the teacher or admin view. Future tables and form-heavy tools can expand here without rewriting the shared admin frame." title="Admin Home" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <SectionCard description="Placeholder metric block" key={item.label} title={item.label}>
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
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard description="Prepared for approval queues, assignment audits, and operational follow-up." title="Pending workflows">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-white p-4">6 essay orders waiting for allocation</li>
            <li className="rounded-xl bg-white p-4">4 user accounts require cohort assignment</li>
            <li className="rounded-xl bg-white p-4">3 elective groups need final approval</li>
          </ul>
        </SectionCard>
        <SectionCard description="Quick links to likely next destinations as the admin surface grows." title="Quick links">
          <div className="grid gap-3">
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600">Open submissions queue</div>
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600">Review essay orders</div>
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600">Publish a new notice</div>
            <div className="rounded-xl bg-white p-4 text-sm text-slate-600">Check analytics snapshot</div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

