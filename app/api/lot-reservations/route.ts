import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { normalizePhoneNumber, PHONE_ERROR } from "@/lib/phone";
import { rateLimited } from "@/lib/rate-limit";
import {
  createLotReservation,
  getLotReservations,
  getUserProfile,
  requireVerified,
  resolveFacilityCode,
} from "@/lib/supabase/server";

const MAX_RESERVATION_DAYS = 31;

function trimRequired(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseReservedUntil(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Reserve until date and time are required.");
  }

  const reservedUntil = new Date(value);
  if (Number.isNaN(reservedUntil.getTime())) {
    throw new Error("Reserve until date and time are invalid.");
  }

  const now = new Date();
  if (reservedUntil.getTime() <= now.getTime()) {
    throw new Error("Reserve until must be in the future.");
  }

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_RESERVATION_DAYS);
  if (reservedUntil.getTime() > maxDate.getTime()) {
    throw new Error("Reservations can only last up to 1 month.");
  }

  return reservedUntil.toISOString();
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestedFacility = request.nextUrl.searchParams.get("facility");
    const facilityCode = await resolveFacilityCode(
      session.openid,
      requestedFacility,
    );
    const reservations = await getLotReservations(facilityCode);

    return NextResponse.json({ reservations, facility: facilityCode });
  } catch (err) {
    console.error("Failed to load lot reservations:", err);
    return NextResponse.json(
      { error: "Failed to load lot reservations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(
    session.openid,
    "lot-reservations:post",
    20,
    60_000,
  );
  if (limited) return limited;

  try {
    await requireVerified(session.openid);

    const profile = await getUserProfile(session.openid);
    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      facility?: string | null;
      level?: string;
      lot?: string;
      reservedUntil?: string;
      purpose?: string;
    };

    const level = trimRequired(body.level);
    const lot = trimRequired(body.lot).toUpperCase();
    const purpose = trimRequired(body.purpose);
    const reservedUntil = parseReservedUntil(body.reservedUntil);
    const reserverUnit = profile.unit || profile.depot || "";

    if (!level || !lot) {
      return NextResponse.json(
        { error: "Level and lot are required." },
        { status: 400 },
      );
    }
    if (!profile.name || !profile.phone || !reserverUnit) {
      return NextResponse.json(
        { error: "Name, phone and platoon are required on your profile." },
        { status: 400 },
      );
    }
    if (!purpose) {
      return NextResponse.json(
        { error: "Purpose is required." },
        { status: 400 },
      );
    }

    const reserverPhone = normalizePhoneNumber(profile.phone);
    const facilityCode = await resolveFacilityCode(session.openid, body.facility);
    const reservation = await createLotReservation({
      facility_code: facilityCode,
      level,
      lot,
      reserved_by: session.openid,
      reserver_name: profile.name,
      reserver_phone: reserverPhone,
      reserver_unit: reserverUnit,
      reserved_until: reservedUntil,
      purpose,
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (err) {
    console.error("Reserve lot failed:", err);
    const message = err instanceof Error ? err.message : "Reserve lot failed";
    const status = message.includes("hasn't been verified")
      ? 403
      : message.includes("required") ||
          message.includes("invalid") ||
          message.includes("future") ||
          message.includes("1 month") ||
          message.includes("occupied") ||
          message.includes("reserved") ||
          message === PHONE_ERROR
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
