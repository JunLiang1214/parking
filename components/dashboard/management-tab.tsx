"use client";

import { Check, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { VehicleUnitOption } from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

export const VEHICLE_UNIT_COLOR_PRESETS = [
  { name: "Fern", hex: "#B4E083" },
  { name: "Night Slate", hex: "#394053" },
  { name: "Sky Reflection", hex: "#C9C5CB" },
  { name: "Orchid Signal", hex: "#D288D3" },
  { name: "Sunlit Clay", hex: "#DA8158" },
  { name: "Clear Sky", hex: "#79A9D1" },
  { name: "Field Gold", hex: "#DDA15E" },
  { name: "Deep Fern", hex: "#607744" },
] as const;

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type ManagementTabProps = {
  activeFacility: string;
  activeFacilityName: string;
  initialVehicleUnits: VehicleUnitOption[];
  onAfterChange?: () => void;
  onVehicleUnitsChange: (vehicleUnits: VehicleUnitOption[]) => void;
  triggerToast: (message: string) => void;
};

type UnitDraft = {
  name: string;
  colorHex: string;
};

function normalizeHex(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#")
    ? trimmed.toUpperCase()
    : `#${trimmed.toUpperCase()}`;
}

function swatchStyle(hex?: string | null) {
  return hex && HEX_PATTERN.test(hex)
    ? { backgroundColor: hex, borderColor: hex }
    : undefined;
}

function emptyDraft(): UnitDraft {
  return {
    name: "",
    colorHex: VEHICLE_UNIT_COLOR_PRESETS[0].hex,
  };
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {VEHICLE_UNIT_COLOR_PRESETS.map((preset) => {
          const isSelected = normalizeHex(value) === preset.hex;
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              onClick={() => onChange(preset.hex)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border-2 transition focus:outline-none focus:ring-3 focus:ring-red-600/15",
                isSelected ? "border-zinc-900" : "border-white shadow-sm",
              )}
              style={swatchStyle(preset.hex)}
            >
              {isSelected && <Check className="size-4 text-white drop-shadow" />}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(normalizeHex(event.target.value))}
        placeholder="#B4E083"
        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold uppercase outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
      />
    </div>
  );
}

export function ManagementTab({
  activeFacility,
  activeFacilityName,
  initialVehicleUnits,
  onAfterChange,
  onVehicleUnitsChange,
  triggerToast,
}: ManagementTabProps) {
  const [draft, setDraft] = useState<UnitDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UnitDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedUnits = useMemo(
    () =>
      [...initialVehicleUnits].sort((a, b) => a.name.localeCompare(b.name)),
    [initialVehicleUnits],
  );

  const publishUnits = (units: VehicleUnitOption[]) => {
    onVehicleUnitsChange(units);
  };

  const loadVehicleUnits = async () => {
    if (!activeFacility) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/vehicle-units?facility=${encodeURIComponent(activeFacility)}`,
      );
      const data = (await response.json()) as {
        vehicleUnits?: VehicleUnitOption[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Load failed");
      publishUnits(data.vehicleUnits || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load units");
    } finally {
      setIsLoading(false);
    }
  };

  const validateDraft = (unitDraft: UnitDraft) => {
    const name = unitDraft.name.trim();
    const colorHex = normalizeHex(unitDraft.colorHex);

    if (!name) throw new Error("Vehicle unit name is required.");
    if (colorHex && !HEX_PATTERN.test(colorHex)) {
      throw new Error("Colour must be a valid HEX value, e.g. #B4E083.");
    }

    return { name, colorHex: colorHex || null };
  };

  const handleCreate = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = validateDraft(draft);
      const response = await fetch("/api/vehicle-units", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          facility: activeFacility,
          name: payload.name,
          colorHex: payload.colorHex,
        }),
      });
      const data = (await response.json()) as {
        unit?: VehicleUnitOption;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Create failed");
      if (data.unit) publishUnits([...initialVehicleUnits, data.unit]);
      setDraft(emptyDraft());
      onAfterChange?.();
      triggerToast("Vehicle unit created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create unit");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (unit: VehicleUnitOption) => {
    setEditingId(unit.id);
    setEditDraft({
      name: unit.name,
      colorHex: unit.color_hex || VEHICLE_UNIT_COLOR_PRESETS[0].hex,
    });
    setError(null);
  };

  const handleUpdate = async (unitId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = validateDraft(editDraft);
      const response = await fetch("/api/vehicle-units", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: unitId,
          name: payload.name,
          colorHex: payload.colorHex,
        }),
      });
      const data = (await response.json()) as {
        unit?: VehicleUnitOption;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Update failed");
      if (data.unit) {
        publishUnits(
          initialVehicleUnits.map((unit) =>
            unit.id === unitId ? data.unit! : unit,
          ),
        );
      }
      setEditingId(null);
      onAfterChange?.();
      triggerToast("Vehicle unit updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update unit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (unit: VehicleUnitOption) => {
    const confirmed = window.confirm(
      `Delete ${unit.name}? Units already used by vehicles cannot be deleted.`,
    );
    if (!confirmed) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/vehicle-units", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: unit.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Delete failed");
      publishUnits(initialVehicleUnits.filter((item) => item.id !== unit.id));
      onAfterChange?.();
      triggerToast("Vehicle unit deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete unit");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Management</h2>
            <p className="text-xs font-medium text-zinc-500">
              Vehicle unit colours for {activeFacilityName}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={loadVehicleUnits}
            disabled={isLoading || isSaving}
            className="h-9 border-zinc-200"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-900">Add Vehicle Unit</h3>
            <p className="text-xs font-medium text-zinc-500">
              New units become available in vehicle logging immediately.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Unit name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Alpha"
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Unit colour
              </label>
              <ColorPicker
                value={draft.colorHex}
                onChange={(colorHex) =>
                  setDraft((current) => ({ ...current, colorHex }))
                }
              />
            </div>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isSaving}
              className="h-10 w-full bg-red-600 hover:bg-red-700"
            >
              <Plus className="mr-2 size-4" />
              Add unit
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 p-4">
            <h3 className="text-sm font-bold text-zinc-900">Vehicle Units</h3>
            <p className="text-xs font-medium text-zinc-500">
              Edit colours, rename units, or delete unused units.
            </p>
          </div>
          <div className="divide-y divide-zinc-100">
            {sortedUnits.map((unit) => {
              const isEditing = editingId === unit.id;
              return (
                <div key={unit.id} className="p-4">
                  {isEditing ? (
                    <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-start">
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="h-10 min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                      />
                      <ColorPicker
                        value={editDraft.colorHex}
                        onChange={(colorHex) =>
                          setEditDraft((current) => ({ ...current, colorHex }))
                        }
                      />
                      <div className="flex gap-2 md:justify-end">
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => handleUpdate(unit.id)}
                          disabled={isSaving}
                          aria-label={`Save ${unit.name}`}
                          className="size-9 bg-red-600 hover:bg-red-700"
                        >
                          <Save className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel edit"
                          className="size-9 border-zinc-200"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="size-9 shrink-0 rounded-lg border"
                          style={swatchStyle(unit.color_hex)}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-900">
                            {unit.name}
                          </p>
                          <p className="text-xs font-semibold uppercase text-zinc-400">
                            {unit.color_hex || "No colour set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => startEditing(unit)}
                          aria-label={`Edit ${unit.name}`}
                          className="size-9 border-zinc-200"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleDelete(unit)}
                          disabled={isSaving}
                          aria-label={`Delete ${unit.name}`}
                          className="size-9 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!sortedUnits.length && (
              <p className="p-6 text-center text-sm font-medium text-zinc-500">
                No vehicle units configured for this depot yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
