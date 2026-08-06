import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  assertLotAvailableForParking,
  checkinVehicle,
  getVehicles,
  requireVerified,
  resolveFacilityCode,
} from "@/lib/supabase/server";
import {
  BRACKETED_PLATE_ERROR,
  bracketedPlateDigitsOnly,
  buildVehicleCheckInPayload,
  isVehicleValidationError,
  normalizeBracketedPlate,
  validateBracketedPlate,
} from "@/lib/vehicles/rules";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const value = (err as { message?: unknown }).message;
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestedFacility = request.nextUrl.searchParams.get("facility");
    const facilityCode = await resolveFacilityCode(session.openid, requestedFacility);
    const list = await getVehicles(facilityCode);
    return NextResponse.json({ vehicles: list, facility: facilityCode });
  } catch (err) {
    console.error("Failed to load vehicles:", err);
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "vehicles:post", 20, 60_000);
  if (limited) return limited;

  try {
    await requireVerified(session.openid);

    const body = await request.json();
    // Validate required fields
    if (!body.plate || !body.level || !body.lot) {
      return NextResponse.json({ error: "Plate, Level and Lot are required" }, { status: 400 });
    }

    const facilityCode = await resolveFacilityCode(session.openid, body.facility);
    await assertLotAvailableForParking(
      facilityCode,
      String(body.level),
      String(body.lot),
    );

    const plateNumber = normalizeBracketedPlate(String(body.plate));
    try {
      validateBracketedPlate(plateNumber);
    } catch {
      return NextResponse.json({ error: BRACKETED_PLATE_ERROR }, { status: 400 });
    }

    // Vehicle Plate masking: entries use 4 digits, with the first digit in
    // brackets (e.g. "(7)085"), while each depot's plates are scoped to a
    // single unit. Set PLATE_MASK_ENABLED to false (and remove this block)
    // to allow longer plate numbers again.
    const PLATE_MASK_ENABLED = true;
    const plateDigitsOnly = bracketedPlateDigitsOnly(plateNumber);

    // Every vehicle's stored id is prefixed with its depot's facility code
    // (e.g. "11FMD-(7)085") so the same bracketed plate can be reused across
    // depots without colliding — the UI only ever shows the part after the
    // prefix. Flip PLATE_MASK_ENABLED to false to go back to plain "MID"
    // prefixed IDs with no depot scoping.
    const plate = PLATE_MASK_ENABLED
      ? `${facilityCode}-${plateNumber}`
      : `MID${plateNumber}`;

    // Warn instead of silently overwriting if this exact plate is already
    // checked in at this depot.
    const existingVehicles = await getVehicles(facilityCode);
    if (
      existingVehicles.some(
        (v) => String(v.id ?? "") === plate || String(v.plate ?? "") === plate,
      )
    ) {
      return NextResponse.json(
        {
          error: `Vehicle plate ${plateNumber} already exists in the system. Confirm the 4-digit plate (${plateDigitsOnly}) and try again.`,
        },
        { status: 409 },
      );
    }

    const data = await checkinVehicle(
      buildVehicleCheckInPayload({
        id: plate,
        facilityCode,
        actorId: session.openid,
        body,
        checkIn: new Date().toISOString(),
      }),
    );

    return NextResponse.json({ success: true, vehicle: data });
  } catch (err) {
    console.error("Check-in failed:", err);
    const message = getErrorMessage(err, "Check-in failed");
    const status = message.includes("hasn't been verified")
      ? 403
      : isVehicleValidationError(err)
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
