import { NextResponse, type NextRequest } from "next/server";

import { getRequestSession } from "@/lib/api-auth";
import { rateLimited } from "@/lib/rate-limit";
import {
  createVehicleUnit,
  deleteVehicleUnit,
  getVehicleUnits,
  logAuditEvent,
  requireAdmin,
  resolveFacilityCode,
  updateVehicleUnit,
} from "@/lib/supabase/server";

const COLOR_HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function normalizeUnitName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeColorHex(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const color = value.trim();
  if (!COLOR_HEX_PATTERN.test(color)) {
    throw new Error("Colour must be a valid HEX value, e.g. #B4E083.");
  }
  return color.toUpperCase();
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
    const { vehicleUnits, error } = await getVehicleUnits(facilityCode);

    return NextResponse.json({
      vehicleUnits,
      facility: facilityCode,
      error,
    });
  } catch (err) {
    console.error("Failed to load vehicle units:", err);
    return NextResponse.json(
      { error: "Failed to load vehicle units" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "vehicle-units:post", 20, 60_000);
  if (limited) return limited;

  try {
    const admin = await requireAdmin(session.openid);
    const body = (await request.json()) as {
      facility?: string | null;
      name?: string;
      colorHex?: string | null;
    };

    const name = normalizeUnitName(body.name);
    if (!name) {
      return NextResponse.json({ error: "Vehicle unit name is required" }, { status: 400 });
    }

    const facilityCode = await resolveFacilityCode(session.openid, body.facility);
    const colorHex = normalizeColorHex(body.colorHex);
    const unit = await createVehicleUnit({
      facility_code: facilityCode,
      name,
      color_hex: colorHex,
    });

    const auditResult = await logAuditEvent({
      actorId: session.openid,
      actorName: admin.name,
      action: "vehicle_unit.create",
      targetId: unit?.id ?? null,
      targetLabel: name,
      details: { facility: facilityCode, colorHex },
    });

    return NextResponse.json(
      { unit, auditLogged: auditResult.success, auditError: auditResult.error },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create vehicle unit";
    const status = message.includes("Only admins")
      ? 403
      : message.includes("HEX") || message.includes("required")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "vehicle-units:patch", 30, 60_000);
  if (limited) return limited;

  try {
    const admin = await requireAdmin(session.openid);
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      colorHex?: string | null;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Vehicle unit id is required" }, { status: 400 });
    }

    const name = body.name !== undefined ? normalizeUnitName(body.name) : undefined;
    if (body.name !== undefined && !name) {
      return NextResponse.json({ error: "Vehicle unit name is required" }, { status: 400 });
    }

    const colorHex =
      body.colorHex !== undefined ? normalizeColorHex(body.colorHex) : undefined;
    const unit = await updateVehicleUnit(body.id, {
      ...(name !== undefined ? { name } : {}),
      ...(colorHex !== undefined ? { color_hex: colorHex } : {}),
    });

    const auditResult = await logAuditEvent({
      actorId: session.openid,
      actorName: admin.name,
      action: "vehicle_unit.update",
      targetId: body.id,
      targetLabel: unit?.name || name || body.id,
      details: { colorHex },
    });

    return NextResponse.json({
      unit,
      auditLogged: auditResult.success,
      auditError: auditResult.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update vehicle unit";
    const status = message.includes("Only admins")
      ? 403
      : message.includes("HEX") || message.includes("required")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimited(session.openid, "vehicle-units:delete", 20, 60_000);
  if (limited) return limited;

  try {
    const admin = await requireAdmin(session.openid);
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json({ error: "Vehicle unit id is required" }, { status: 400 });
    }

    const result = await deleteVehicleUnit(body.id);

    const auditResult = await logAuditEvent({
      actorId: session.openid,
      actorName: admin.name,
      action: "vehicle_unit.delete",
      targetId: body.id,
      targetLabel: result.unit?.name || body.id,
      details: { facility: result.unit?.facility_code },
    });

    return NextResponse.json({
      success: true,
      auditLogged: auditResult.success,
      auditError: auditResult.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete vehicle unit";
    const status = message.includes("Only admins")
      ? 403
      : message.includes("in use") || message.includes("required")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
