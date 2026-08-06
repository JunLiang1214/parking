"use client";

import { format } from "date-fns";
import { Calendar, Phone, User, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

type ReserveLotDialogProps = {
  activeFacilityName: string;
  level: string;
  lot: string;
  profileName: string;
  profilePhone: string;
  profileUnit: string;
  isSubmitting: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    reserveDate: string;
    reserveTime: string;
    purpose: string;
  }) => void;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function ReserveLotDialog({
  activeFacilityName,
  level,
  lot,
  profileName,
  profilePhone,
  profileUnit,
  isSubmitting,
  formError,
  onClose,
  onSubmit,
}: ReserveLotDialogProps) {
  const now = useMemo(() => new Date(), []);
  const today = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    [now],
  );
  const maxDate = useMemo(() => {
    const date = new Date(now);
    date.setDate(date.getDate() + 31);
    return date;
  }, [now]);
  const [reserveDate, setReserveDate] = useState(toDateInputValue(now));
  const [reserveTime, setReserveTime] = useState("18:00");
  const [purpose, setPurpose] = useState("");
  const selectedDate = parseDateInput(reserveDate);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ reserveDate, reserveTime, purpose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border-zinc-200 shadow-xl animate-in zoom-in-95 duration-200">
        <CardHeader className="shrink-0 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Reserve Lot</CardTitle>
              <CardDescription>
                {activeFacilityName} - {level} Lot {lot}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-full"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {formError}
              </p>
            )}

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                <User className="size-3.5" />
                Reserving user
              </div>
              <p className="mt-2 text-sm font-bold text-zinc-900">
                {profileName}
              </p>
              <p className="text-xs font-semibold text-zinc-500">
                {profileUnit}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
                <Phone className="size-3" />
                {formatPhoneDisplay(profilePhone) || profilePhone}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Level
                </label>
                <input
                  type="text"
                  value={level}
                  readOnly
                  className="h-10 w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Lot
                </label>
                <input
                  type="text"
                  value={lot}
                  readOnly
                  className="h-10 w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-600 outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Reserve until date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 w-full justify-between rounded-md border-zinc-200 bg-white px-3 text-left text-sm font-normal hover:bg-zinc-50 focus:border-red-600 focus:ring-3 focus:ring-red-600/15",
                        !reserveDate && "text-muted-foreground",
                      )}
                    >
                      <span>
                        {selectedDate
                          ? format(selectedDate, "dd MMM yyyy")
                          : "Select date"}
                      </span>
                      <Calendar className="size-4 text-zinc-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto rounded-md border border-zinc-200 bg-white p-0 shadow-md"
                    align="start"
                  >
                    <DatePickerCalendar
                      mode="single"
                      selected={selectedDate}
                      captionLayout="label"
                      startMonth={today}
                      endMonth={maxDate}
                      disabled={{ before: today, after: maxDate }}
                      onSelect={(date) => {
                        setReserveDate(date ? toDateInputValue(date) : "");
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Reserve until time
                </label>
                <input
                  type="time"
                  value={reserveTime}
                  onChange={(event) => setReserveTime(event.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">
                Purpose
              </label>
              <textarea
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                required
                placeholder="e.g. Hold lot for incoming vehicle"
                className="min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 border-zinc-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? "Reserving..." : "Reserve lot"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
