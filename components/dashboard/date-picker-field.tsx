"use client";

import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

type NativeDateBounds = {
  before?: Date;
  after?: Date;
};

type NativeDateDisabled = NativeDateBounds | NativeDateBounds[] | boolean;

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
    disabled?: NativeDateDisabled;
  };
  showClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
};

function getDisabledBound(
  disabled: NativeDateDisabled | undefined,
  key: keyof NativeDateBounds,
) {
  if (!disabled || typeof disabled === "boolean") return undefined;
  if (Array.isArray(disabled)) {
    return disabled.find((entry) => entry?.[key])?.[key];
  }
  return disabled[key];
}

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
  const minDate = getDisabledBound(calendar?.disabled, "before");
  const maxDate = getDisabledBound(calendar?.disabled, "after");

  return (
    <div className={cn("flex gap-2", className)}>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={minDate ? toDateInputValue(minDate) : undefined}
        max={maxDate ? toDateInputValue(maxDate) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-10 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-red-600 focus:ring-3 focus:ring-red-600/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
          buttonClassName,
        )}
      />

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
