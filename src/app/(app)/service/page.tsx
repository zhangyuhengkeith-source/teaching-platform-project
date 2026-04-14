import { redirect } from "next/navigation";
import { FilePenLine } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { redirectAfterLogin } from "@/lib/auth/redirect-after-login";
import { isExternalStudent } from "@/lib/permissions/profiles";

export default async function ServicePage() {
  const profile = await requireAuth();

  if (!isExternalStudent(profile)) {
    redirect(redirectAfterLogin(profile));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="servicePage.description" />}
        title={<TranslationText translationKey="servicePage.title" />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          description={<TranslationText translationKey="servicePage.overviewDescription" />}
          title={<TranslationText translationKey="servicePage.overviewTitle" />}
        >
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              <TranslationText translationKey="servicePage.overviewPoint1" />
            </p>
            <p>
              <TranslationText translationKey="servicePage.overviewPoint2" />
            </p>
          </div>
        </SectionCard>
        <SectionCard
          description={<TranslationText translationKey="servicePage.placeholdersDescription" />}
          title={<TranslationText translationKey="servicePage.placeholdersTitle" />}
        >
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <TranslationText translationKey="servicePage.placeholderIntake" />
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <TranslationText translationKey="servicePage.placeholderQueue" />
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <TranslationText translationKey="servicePage.placeholderDelivery" />
            </div>
          </div>
        </SectionCard>
      </div>
      <SectionCard
        description={<TranslationText translationKey="servicePage.readyDescription" />}
        title={<TranslationText translationKey="servicePage.readyTitle" />}
      >
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-white p-6">
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <FilePenLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">
              <TranslationText translationKey="servicePage.emptyTitle" />
            </p>
            <p className="text-sm text-muted-foreground">
              <TranslationText translationKey="servicePage.emptyDescription" />
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
