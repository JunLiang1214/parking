"use client";

import { Edit2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatPlateDisplay,
  normalizeParkingValue,
  type DriveoutRecord,
  type ParkingLevelConfig,
} from "@/lib/dashboard/dashboard-data";

type EditDriveOutLocationDialogProps = {
  destination: string;
  isSubmitting: boolean;
  record: DriveoutRecord;
  onCancel: () => void;
  onDestinationChange: (destination: string) => void;
  onSubmit: () => void;
};

type DriveBackDialogProps = {
  error: string | null;
  isSubmitting: boolean;
  level: string;
  lot: string;
  lotOptions: string[];
  occupiedLots: Record<string, unknown>;
  parkingLevels: ParkingLevelConfig[];
  record: DriveoutRecord;
  onCancel: () => void;
  onLevelChange: (level: string) => void;
  onLotChange: (lot: string) => void;
  onSubmit: () => void;
};

export function EditDriveOutLocationDialog({
  destination,
  isSubmitting,
  record,
  onCancel,
  onDestinationChange,
  onSubmit,
}: EditDriveOutLocationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-sm rounded-xl border-zinc-200 shadow-xl animate-in zoom-in-95 duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-red-600">
            <Edit2 className="size-5" />
            Edit vehicle location
          </CardTitle>
          <CardDescription>
            Update where {formatPlateDisplay(record.plate)} is currently moved to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={destination}
            onChange={(event) => onDestinationChange(event.target.value)}
            placeholder="Optional destination or notes..."
            className="min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
          />
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 font-bold hover:bg-red-700"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DriveBackDialog({
  error,
  isSubmitting,
  level,
  lot,
  lotOptions,
  occupiedLots,
  parkingLevels,
  record,
  onCancel,
  onLevelChange,
  onLotChange,
  onSubmit,
}: DriveBackDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-sm rounded-xl border-zinc-200 shadow-xl animate-in zoom-in-95 duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-red-600">
            <RotateCcw className="size-5" />
            Drive vehicle back
          </CardTitle>
          <CardDescription>
            Choose a parking lot for {formatPlateDisplay(record.plate)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Level
              </label>
              <select
                value={level}
                onChange={(event) => onLevelChange(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
              >
                <option value="" disabled>
                  Select level
                </option>
                {parkingLevels.map((parkingLevel) => (
                  <option key={parkingLevel.id} value={parkingLevel.id}>
                    {parkingLevel.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Lot No.
              </label>
              <select
                value={lot}
                onChange={(event) => onLotChange(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600"
              >
                <option value="" disabled>
                  Select lot
                </option>
                {lotOptions.map((lotOption) => {
                  const occupiedVehicle =
                    occupiedLots[normalizeParkingValue(lotOption)];

                  return (
                    <option
                      key={lotOption}
                      value={lotOption}
                      disabled={Boolean(occupiedVehicle)}
                    >
                      {lotOption}
                      {occupiedVehicle ? " (occupied)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 font-bold hover:bg-red-700"
            >
              {isSubmitting ? "Moving..." : "Drive back"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
