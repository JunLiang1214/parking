import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  requireVerified,
  resolveFacilityCode,
  updateHistoryMoveTo,
} from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patchLimited = rateLimited(session.openid, "history:patch", 30, 60_000);
  if (patchLimited) return patchLimited;

  const { id } = await params;

  try {
    await requireVerified(session.openid);
    const body = await request.json();
    const facilityCode = await resolveFacilityCode(session.openid, body.facility);
    const moveTo =
      typeof body.move_to === "string" && body.move_to.trim()
        ? body.move_to.trim()
        : null;
    const history = await updateHistoryMoveTo(id, facilityCode, moveTo);
    return NextResponse.json({ success: true, history });
  } catch (err) {
    console.error("Update drive-out location failed:", err);
    const message =
      err instanceof Error ? err.message : "Update drive-out location failed";
    const status = message.includes("hasn't been verified") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
