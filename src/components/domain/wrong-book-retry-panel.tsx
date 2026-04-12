"use client";

import { useState, useTransition } from "react";

import { retryWrongBookItemAction } from "@/lib/server/actions/retry-wrong-book-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WrongBookItemSummary } from "@/types/domain";

export function WrongBookRetryPanel({ item }: { item: WrongBookItemSummary }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!item.sourceItem || item.status !== "active") {
    return null;
  }

  const onRetry = () => {
    startTransition(async () => {
      try {
        const submitted_answer_json =
          item.sourceItem?.itemType === "mcq"
            ? { selectedOptionId }
            : { text: value };

        const result = await retryWrongBookItemAction({
          wrong_book_item_id: item.id,
          submitted_answer_json,
        });

        setMessage(result.isCorrect ? "Retry correct. The item has been marked mastered." : "Retry recorded. The item remains active.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to submit retry.");
      }
    });
  };

  if (item.sourceItem.itemType === "mcq" && "options" in item.sourceItem.answerKey) {
    return (
      <div className="space-y-3">
        <div className="grid gap-2">
          {item.sourceItem.answerKey.options.map((option) => (
            <button
              className={`rounded-xl border px-3 py-2 text-left text-sm ${selectedOptionId === option.id ? "border-blue-300 bg-blue-50" : "border-border bg-white"}`}
              key={option.id}
              onClick={() => setSelectedOptionId(option.id)}
              type="button"
            >
              <span className="font-medium">{option.id}.</span> {option.label}
            </button>
          ))}
        </div>
        <Button disabled={!selectedOptionId || isPending} onClick={onRetry} type="button">
          {isPending ? "Retrying..." : "Retry item"}
        </Button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input onChange={(event) => setValue(event.target.value)} placeholder="Type your retry answer" value={value} />
      <Button disabled={!value.trim() || isPending} onClick={onRetry} type="button">
        {isPending ? "Retrying..." : "Retry item"}
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
