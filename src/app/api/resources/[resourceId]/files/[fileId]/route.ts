import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { ROUTES } from "@/lib/constants/routes";
import { RESOURCE_FILE_SIGNED_URL_TTL_SECONDS, splitStorageFilePath } from "@/lib/db/storage";
import { canViewResource } from "@/lib/permissions/resources";
import { getResourceById } from "@/lib/queries/resources";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resourceId: string; fileId: string }> },
) {
  const { resourceId, fileId } = await params;
  const session = await getSession();

  if (!session.isAuthenticated || !session.profile) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  const resource = await getResourceById(resourceId);
  const file = resource?.files?.find((entry) => entry.id === fileId);

  if (!resource || !file) {
    return NextResponse.json({ message: "Resource file not found." }, { status: 404 });
  }

  const space = await getSpaceById(resource.spaceId);
  if (!space) {
    return NextResponse.json({ message: "Resource file not found." }, { status: 404 });
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canViewResource(session.profile, { resource, space, memberships })) {
    return NextResponse.json({ message: "Resource file not found." }, { status: 404 });
  }

  const parsedPath = splitStorageFilePath(file.filePath);
  if (!parsedPath) {
    return NextResponse.json({ message: "Invalid file path." }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ message: "Storage is not configured." }, { status: 503 });
  }

  const { data, error } = await supabase.storage
    .from(parsedPath.bucket)
    .createSignedUrl(parsedPath.objectPath, RESOURCE_FILE_SIGNED_URL_TTL_SECONDS, {
      download: file.fileName,
    });

  if (error || !data?.signedUrl) {
    return NextResponse.json({ message: error?.message ?? "Unable to create a download link." }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
