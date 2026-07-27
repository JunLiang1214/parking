"use client";

import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type DashboardVehicle, formatPlateDisplay } from "@/lib/dashboard/dashboard-data";

type DriveOutDestinationDialogProps = {
  destination: string;
  isSubmitting: boolean;
  vehicle: DashboardVehicle;
  onCancel: () => void;
  onDestinationChange: (destination: string) => void;
  onSubmit: () => void;
};

export function DriveOutDestinationDialog({
  destination,
  isSubmitting,
  vehicle,
  onCancel,
  onDestinationChange,
  onSubmit,
}: DriveOutDestinationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-sm rounded-xl border-zinc-200 shadow-xl animate-in zoom-in-95 duration-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600 font-bold flex items-center gap-2">
            <MapPin className="size-5" />
            Move Destination
          </CardTitle>
          <CardDescription>
            Add where {formatPlateDisplay(vehicle.plate)} is moving off to.
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
              className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
