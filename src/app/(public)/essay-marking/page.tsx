import Link from "next/link";
import { CheckCircle2, FilePenLine, MessagesSquare } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { titleKey: "essayMarkingPage.features.intakeTitle" as const, descriptionKey: "essayMarkingPage.features.intakeDescription" as const, icon: FilePenLine },
  { titleKey: "essayMarkingPage.features.feedbackTitle" as const, descriptionKey: "essayMarkingPage.features.feedbackDescription" as const, icon: MessagesSquare },
  { titleKey: "essayMarkingPage.features.deliveryTitle" as const, descriptionKey: "essayMarkingPage.features.deliveryDescription" as const, icon: CheckCircle2 },
];

export default function EssayMarkingPage() {
  return (
    <PublicLayout>
      <section className="container-shell py-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500"><TranslationText translationKey="essayMarkingPage.eyebrow" /></p>
          <h1 className="text-4xl font-semibold sm:text-5xl"><TranslationText translationKey="essayMarkingPage.title" /></h1>
          <p className="text-lg leading-8 text-slate-600"><TranslationText translationKey="essayMarkingPage.description" /></p>
          <Button asChild>
            <Link href="/register"><TranslationText translationKey="essayMarkingPage.createAccount" /></Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.titleKey}>
                <CardContent className="space-y-4 p-6">
                  <div className="inline-flex rounded-xl bg-blue-50 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold"><TranslationText translationKey={feature.titleKey} /></h2>
                    <p className="text-sm leading-7 text-muted-foreground"><TranslationText translationKey={feature.descriptionKey} /></p>
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
