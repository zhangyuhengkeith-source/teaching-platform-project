import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/require-auth";
import { isInternalStudent } from "@/lib/permissions/profiles";
import {
  listUnreadChangeNotificationsForStudent,
  markChangeNotificationsReadForStudent,
} from "@/services/content-change-notification-service";

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
});

export async function GET() {
  const profile = await requireAuth();

  if (!isInternalStudent(profile)) {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await listUnreadChangeNotificationsForStudent(profile.id);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const profile = await requireAuth();

  if (!isInternalStudent(profile)) {
    return NextResponse.json({ error: "Only students can mark student change notifications as read." }, { status: 403 });
  }

  const parsed = markReadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification payload." }, { status: 400 });
  }

  const readCount = await markChangeNotificationsReadForStudent(profile.id, parsed.data.notificationIds);
  return NextResponse.json({ ok: true, readCount });
}
