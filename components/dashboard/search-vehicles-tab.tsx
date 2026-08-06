"use client";

import { CarFront, CheckCircle2, Search, XCircle } from "lucide-react";

import { Skeleton } from "@/components/dashboard/status-indicators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPlateDisplay } from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type SearchVehicle = {
  id: string;
  plate?: string | null;
  vehicle_unit?: string | null;
  variant?: string | null;
  level?: string | null;
  lot?: string | null;
  check_in?: string | null;
  updated_at?: string | null;
  driver?: string | null;
  is_vor?: boolean | null;
  next_servicing?: string | null;
};

type VehicleUnitOption = {
  id: string;
  name: string;
};

type SearchVehiclesTabProps = {
  filteredVehicles: SearchVehicle[];
  isLoading: boolean;
  searchQuery: string;
  searchVehicleUnit: string;
  vehicleUnits: VehicleUnitOption[];
  formatTimeAgo: (iso: string) => string;
  isServicingDue: (vehicle: SearchVehicle) => boolean;
  onOpenVehicle: (vehicle: SearchVehicle) => void;
  onSearchQueryChange: (value: string) => void;
  onSearchVehicleUnitChange: (value: string) => void;
  vehicleUnitColor: (vehicle: { vehicle_unit?: string | null }) => string | null;
  vehicleUnitLabel: (vehicle: { vehicle_unit?: string | null }) => string;
};

export function SearchVehiclesTab({
  filteredVehicles,
  isLoading,
  searchQuery,
  searchVehicleUnit,
  vehicleUnits,
  formatTimeAgo,
  isServicingDue,
  onOpenVehicle,
  onSearchQueryChange,
  onSearchVehicleUnitChange,
  vehicleUnitColor,
  vehicleUnitLabel,
}: SearchVehiclesTabProps) {
  const updatedAtLabel = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-SG", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search vehicle plate, unit, variant or driver..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 bg-white text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 shadow-xs"
          />
        </div>
        <Select
          value={searchVehicleUnit}
          onValueChange={onSearchVehicleUnitChange}
        >
          <SelectTrigger className="w-full h-10 bg-white border-zinc-200 focus:border-red-600 focus:ring-3 focus:ring-red-600/15 justify-between">
            <SelectValue placeholder="All vehicle units" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-zinc-200 shadow-md rounded-md">
            <SelectItem value="all" className="cursor-pointer">
              All vehicle units
            </SelectItem>
            {vehicleUnits.map((unit) => (
              <SelectItem
                key={unit.id}
                value={unit.name}
                className="cursor-pointer"
              >
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center gap-4"
            >
              <Skeleton className="size-10 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => {
            const serviceDue = isServicingDue(vehicle);
            const unitColor = vehicleUnitColor(vehicle);

            return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onOpenVehicle(vehicle)}
              className={cn(
                "cursor-pointer border p-4 rounded-xl flex items-start justify-between gap-4 transition-all text-left",
                serviceDue
                  ? "border-amber-300 bg-amber-50/70 shadow-sm shadow-amber-100 hover:border-amber-400"
                  : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xs",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="size-10 bg-zinc-100 text-zinc-600 rounded-lg border-2 flex items-center justify-center"
                  style={unitColor ? { borderColor: unitColor } : undefined}
                >
                  <CarFront
                    className="size-5"
                    style={unitColor ? { color: unitColor } : undefined}
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-zinc-900">
                    {formatPlateDisplay(vehicle.plate)}
                  </div>
                  <p className="text-[11px] font-semibold text-zinc-400">
                    {vehicleUnitLabel(vehicle)}
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">
                    {vehicle.variant} &nbsp;·&nbsp; {vehicle.level} · Lot{" "}
                    {vehicle.lot}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {vehicle.is_vor ? (
                  <XCircle className="mt-0.5 size-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                )}
                <div className="w-28 text-right sm:w-32">
                  <p className="text-xs text-red-600 font-semibold">
                    {formatTimeAgo(vehicle.check_in || "")}
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                    Updated
                  </p>
                  <p className="break-words text-[10px] font-semibold leading-tight text-zinc-500">
                    {updatedAtLabel(vehicle.updated_at)}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 truncate">
                    {vehicle.driver || "-"}
                  </p>
                </div>
              </div>
            </button>
            );
          })
        ) : (
          <p className="text-zinc-500 text-sm py-8 text-center col-span-full font-medium">
            No active vehicles found matching search.
          </p>
        )}
      </div>
    </div>
  );
}
