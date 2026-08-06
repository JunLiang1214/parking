import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  cancelLotReservation,
  getLotReservationById,
  requireVerified,
  resolveFacilityCode,
} from "@/lib/supabase/server";

const LOT_RESERVATIONS_SETUP_ERROR =
  "Lot reservations are not ready yet. Please run supabase/lot_reservations.sql in the Supabase SQL editor.";

function isDatabaseSetupError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("permission denied") ||
    normalized.includes("lot_reservations") ||
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache")
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(_request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const limited = rateLimited(
    session.openid,
    `lot-reservations:delete:${id}`,
    20,
    60_000,
  );
  if (limited) return limited;

  try {
    await requireVerified(session.openid);

    const reservation = await getLotReservationById(id);
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 },
      );
    }

    const allowedFacility = await resolveFacilityCode(
      session.openid,
      reservation.facility_code,
    );
    if (allowedFacility !== reservation.facility_code) {
      return NextResponse.json(
        { error: "This reservation belongs to a different depot." },
        { status: 403 },
      );
    }

    const clearedReservation = await cancelLotReservation(id);

    return NextResponse.json({ reservation: clearedReservation });
  } catch (err) {
    console.error("Free reserved lot failed:", err);
    const message = err instanceof Error ? err.message : "Free lot failed";
    const setupError = isDatabaseSetupError(message);
    const status = setupError
      ? 500
      : message.includes("hasn't been verified")
        ? 403
        : message.includes("already cleared")
          ? 409
          : 500;

    return NextResponse.json(
      { error: setupError ? LOT_RESERVATIONS_SETUP_ERROR : message },
      { status },
    );
  }
}
