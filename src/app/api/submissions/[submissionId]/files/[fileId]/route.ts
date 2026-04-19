import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { ROUTES } from "@/lib/constants/routes";
import { mapTaskSubmissionFileRow, mapTaskSubmissionRow } from "@/lib/db/mappers";
import { SUBMISSION_FILE_SIGNED_URL_TTL_SECONDS } from "@/lib/db/storage";
import { canViewSubmission } from "@/lib/permissions/tasks";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { getGroupForUserInElective } from "@/lib/queries/electives";
import { getTaskById } from "@/lib/queries/tasks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSignedDownloadUrl,
  getStorageServiceErrorStatusCode,
  isStorageServiceError,
} from "@/services/storage-server-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string; fileId: string }> },
) {
  const { submissionId, fileId } = await params;
  const session = await getSession();

  if (!session.isAuthenticated || !session.profile) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ message: "Storage is not configured." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("task_submissions")
    .select("*, task_submission_files(*)")
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: "Submission file not found." }, { status: 404 });
  }

  const submission = mapTaskSubmissionRow(data, data.task_submission_files?.map(mapTaskSubmissionFileRow));
  const file = submission.files?.find((entry) => entry.id === fileId);
  if (!file) {
    return NextResponse.json({ message: "Submission file not found." }, { status: 404 });
  }

  const task = await getTaskById(submission.taskId);
  if (!task) {
    return NextResponse.json({ message: "Submission file not found." }, { status: 404 });
  }

  const space = await getSpaceById(task.spaceId);
  if (!space) {
    return NextResponse.json({ message: "Submission file not found." }, { status: 404 });
  }

  const memberships = await listMembershipsForSpace(space.id);
  const group = space.type === "elective" && submission.submitterGroupId ? await getGroupForUserInElective(space.id, session.profile.id) : null;
  if (!canViewSubmission(session.profile, submission, group, { space, memberships })) {
    return NextResponse.json({ message: "Submission file not found." }, { status: 404 });
  }

  try {
    const signedUrl = await createSignedDownloadUrl({
      filePath: file.filePath,
      downloadFileName: file.fileName,
      expiresInSeconds: SUBMISSION_FILE_SIGNED_URL_TTL_SECONDS,
    });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    if (isStorageServiceError(error)) {
      return NextResponse.json({ message: error.message }, { status: getStorageServiceErrorStatusCode(error) });
    }

    throw error;
  }
}
