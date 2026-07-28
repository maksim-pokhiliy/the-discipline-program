import { type ReactElement } from "react";

export type DatePickerStubProps = {
  value: Date | null;
  onChange: (next: Date | null) => void;
};

export const DatePickerStub = ({ value, onChange }: DatePickerStubProps): ReactElement => (
  <input
    data-testid="datepicker"
    data-value={value ? value.toISOString() : ""}
    onChange={(event) => onChange(new Date(event.target.value))}
  />
);
