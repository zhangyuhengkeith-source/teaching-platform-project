import Link from "next/link";
import { ArrowRight, BookOpenText, GraduationCap, PenSquare } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  {
    titleKey: "home.modules.dashboardTitle" as const,
    descriptionKey: "home.modules.dashboardDescription" as const,
    icon: GraduationCap,
  },
  {
    titleKey: "home.modules.essayTitle" as const,
    descriptionKey: "home.modules.essayDescription" as const,
    icon: PenSquare,
  },
  {
    titleKey: "home.modules.growthTitle" as const,
    descriptionKey: "home.modules.growthDescription" as const,
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
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500"><TranslationText translationKey="home.eyebrow" /></p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
                <TranslationText translationKey="home.title" />
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                <TranslationText translationKey="home.description" />
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  <TranslationText translationKey="home.beginPlatform" />
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <Card className="bg-slate-900 text-slate-100">
            <CardHeader>
              <CardTitle className="text-white"><TranslationText translationKey="home.workflowTitle" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
              <p><TranslationText translationKey="home.workflowPoint1" /></p>
              <p><TranslationText translationKey="home.workflowPoint2" /></p>
              <p><TranslationText translationKey="home.workflowPoint3" /></p>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="container-shell pb-20">
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-semibold"><TranslationText translationKey="home.modulesTitle" /></h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground"><TranslationText translationKey="home.modulesDescription" /></p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.titleKey}>
                <CardContent className="space-y-4 p-6">
                  <div className="inline-flex rounded-xl bg-blue-50 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold"><TranslationText translationKey={module.titleKey} /></h3>
                    <p className="text-sm leading-7 text-muted-foreground"><TranslationText translationKey={module.descriptionKey} /></p>
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
