import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FlashcardViewer({
  front,
  back,
  onMark,
  isSubmitting,
  feedback,
}: {
  front: string;
  back: string;
  onMark: (value?: "got_it" | "needs_review") => void;
  isSubmitting: boolean;
  feedback?: { explanation?: string | null } | null;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Flashcard Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border bg-slate-50 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{isFlipped ? "Back" : "Front"}</p>
          <p className="mt-3 text-base leading-7 text-slate-900">{isFlipped ? back : front}</p>
        </div>
        {feedback?.explanation ? (
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {feedback.explanation}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setIsFlipped((value) => !value)} type="button" variant="outline">
            {isFlipped ? "Show front" : "Flip card"}
          </Button>
          <Button disabled={isSubmitting} onClick={() => onMark("got_it")} type="button">
            {isSubmitting ? "Saving..." : "I got it"}
          </Button>
          <Button disabled={isSubmitting} onClick={() => onMark("needs_review")} type="button" variant="outline">
            Mark for review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
