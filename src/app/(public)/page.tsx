import Link from "next/link";
import { ArrowRight, BookOpenText, GraduationCap, PenSquare } from "lucide-react";

import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  {
    title: "Teaching Dashboard",
    description: "A focused operational home for classes, electives, notices, and instructional follow-through.",
    icon: GraduationCap,
  },
  {
    title: "Essay Marking Service",
    description: "A dedicated client-facing pathway for external essay submissions, revision guidance, and feedback delivery.",
    icon: PenSquare,
  },
  {
    title: "Student Growth Tools",
    description: "Classroom continuity through notifications, wrong-book review, and progressive academic support.",
    icon: BookOpenText,
  },
];

export default function HomePage() {
  return (
    <PublicLayout>
      <section className="container-shell py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Personal Teaching Platform</p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
                A calm digital home for teaching, essay feedback, and student growth.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                This MVP foundation prepares a real product architecture for course management, elective programs, essay marking service, and role-aware student experiences.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Begin the platform
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/essay-marking">Explore essay marking</Link>
              </Button>
            </div>
          </div>
          <Card className="bg-slate-900 text-slate-100">
            <CardHeader>
              <CardTitle className="text-white">Designed for a real academic workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
              <p>Route groups already separate public marketing surfaces, student app workflows, and admin operations.</p>
              <p>Supabase auth scaffolding is in place so role resolution and profile bootstrap can be wired to data without rewriting layouts.</p>
              <p>The design language stays light, measured, and trustworthy rather than loud or trend-chasing.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="container-shell pb-20">
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-semibold">Three connected modules</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">Each slice is intentionally modest for now, but the platform structure is ready for real data and richer workflows.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title}>
                <CardContent className="space-y-4 p-6">
                  <div className="inline-flex rounded-xl bg-blue-50 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{module.title}</h3>
                    <p className="text-sm leading-7 text-muted-foreground">{module.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}

