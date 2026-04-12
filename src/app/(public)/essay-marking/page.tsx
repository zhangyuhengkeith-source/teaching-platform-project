import Link from "next/link";
import { CheckCircle2, FilePenLine, MessagesSquare } from "lucide-react";

import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { title: "Submission intake", description: "Structured order capture with room for future urgency tiers and service options.", icon: FilePenLine },
  { title: "Feedback workflow", description: "Prepared for annotated comments, summary notes, and revision guidance.", icon: MessagesSquare },
  { title: "Delivery clarity", description: "A calm client experience with transparent status markers and next-step guidance.", icon: CheckCircle2 },
];

export default function EssayMarkingPage() {
  return (
    <PublicLayout>
      <section className="container-shell py-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Essay Marking Service</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">A clear, professional path for external essay support.</h1>
          <p className="text-lg leading-8 text-slate-600">This placeholder page establishes the future service surface for order intake, progress visibility, and delivery of meaningful academic feedback.</p>
          <Button asChild>
            <Link href="/register">Create a service account</Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="space-y-4 p-6">
                  <div className="inline-flex rounded-xl bg-blue-50 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{feature.title}</h2>
                    <p className="text-sm leading-7 text-muted-foreground">{feature.description}</p>
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
