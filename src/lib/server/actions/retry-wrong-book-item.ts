"use server";

import { revalidatePath } from "next/cache";

import { retryWrongBookItem } from "@/lib/mutations/exercises";
import { requireAuth } from "@/lib/auth/require-auth";
import { canRetryWrongBookItem } from "@/lib/permissions/exercises";
import { getWrongBookItemDetailForUser } from "@/lib/queries/exercises";
import { retryWrongBookItemSchema, submittedAnswerSchemaForItemType } from "@/lib/validations/exercises";

export async function retryWrongBookItemAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = retryWrongBookItemSchema.parse(input);
  const wrongBookItem = await getWrongBookItemDetailForUser(profile, parsed.wrong_book_item_id);

  if (!wrongBookItem || !wrongBookItem.sourceItem || !canRetryWrongBookItem(profile, wrongBookItem)) {
    throw new Error("You do not have access to retry this wrong-book item.");
  }

  if (wrongBookItem.sourceItem.itemType === "flashcard") {
    throw new Error("Flashcards are not retried through wrong-book.");
  }

  const parsedAnswer = submittedAnswerSchemaForItemType(wrongBookItem.sourceItem.itemType).parse(parsed.submitted_answer_json);
  const normalizedInput = {
    ...parsed,
    submitted_answer_json: parsedAnswer,
  };

  const result = await retryWrongBookItem(profile, normalizedInput as { wrong_book_item_id: string; submitted_answer_json: { selectedOptionId: string } | { text: string } });
  revalidatePath("/wrong-book");
  return result;
}
