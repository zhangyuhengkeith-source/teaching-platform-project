import { SectionCard } from "@/components/shared/section-card";

export default function ClassManagementLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SectionCard description={<span className="block h-4 w-full animate-pulse rounded bg-slate-200" />} key={index} title={<span className="block h-5 w-40 animate-pulse rounded bg-slate-200" />}>
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
