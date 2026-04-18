import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { ROUTES } from "@/lib/constants/routes";
import { mapTaskSubmissionFileRow, mapTaskSubmissionRow } from "@/lib/db/mappers";
import { SUBMISSION_FILE_SIGNED_URL_TTL_SECONDS, splitStorageFilePath } from "@/lib/db/storage";
import { canViewSubmission } from "@/lib/permissions/electives";
import { getGroupForUserInElective, getTaskById } from "@/lib/queries/electives";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const group = submission.submitterGroupId ? await getGroupForUserInElective(space.id, session.profile.id) : null;
  if (!canViewSubmission(session.profile, submission, group, { space, memberships })) {
    return NextResponse.json({ message: "Submission file not found." }, { status: 404 });
  }

  const parsedPath = splitStorageFilePath(file.filePath);
  if (!parsedPath) {
    return NextResponse.json({ message: "Invalid file path." }, { status: 404 });
  }

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from(parsedPath.bucket)
    .createSignedUrl(parsedPath.objectPath, SUBMISSION_FILE_SIGNED_URL_TTL_SECONDS, {
      download: file.fileName,
    });

  if (signedUrlError || !signedUrl?.signedUrl) {
    return NextResponse.json({ message: signedUrlError?.message ?? "Unable to create a download link." }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
