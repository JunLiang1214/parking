"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  parseDateInput,
  toDateInputValue,
} from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  calendar?: {
    captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
    navLayout?: "around" | "after";
    startMonth?: Date;
    endMonth?: Date;
    disabled?: Parameters<typeof DatePickerCalendar>[0]["disabled"];
  };
  showClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
};

export function DatePickerField({
  value,
  onChange,
  placeholder = "Select date",
  className,
  buttonClassName,
  calendar,
  showClear = false,
  clearLabel = "Clear",
  disabled = false,
}: DatePickerFieldProps) {
  const selectedDate = parseDateInput(value);
  const currentYear = new Date().getFullYear();

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-10 min-w-0 flex-1 justify-between rounded-md border-zinc-200 bg-white px-3 text-left text-sm font-normal hover:bg-zinc-50 focus:border-red-600 focus:ring-3 focus:ring-red-600/15",
              !value && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <span>
              {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
            </span>
            <Calendar className="size-4 text-zinc-400" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto rounded-md border border-zinc-200 bg-white p-0 shadow-md"
          align="start"
        >
          <DatePickerCalendar
            mode="single"
            selected={selectedDate}
            captionLayout="dropdown"
            navLayout="after"
            startMonth={new Date(currentYear - 1, 0)}
            endMonth={new Date(currentYear + 20, 11)}
            {...calendar}
            onSelect={(date) => {
              onChange(date ? toDateInputValue(date) : "");
            }}
          />
        </PopoverContent>
      </Popover>

      {showClear && value ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange("")}
          disabled={disabled}
          className="h-10 px-3 text-xs font-semibold"
        >
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
