import { DatePickerField } from "@/components/dashboard/date-picker-field";

type FireExpiryPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function FireExpiryPicker({ value, onChange }: FireExpiryPickerProps) {
  return <DatePickerField value={value} onChange={onChange} />;
}
