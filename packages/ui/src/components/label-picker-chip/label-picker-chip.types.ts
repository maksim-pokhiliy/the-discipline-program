import { type AppLevelValue, type Label } from "@repo/contracts/lms/label";

export type LabelPickerChipProps = {
  value: Label | null;
  options: Label[];
  level: AppLevelValue;
  onChange: (labelId: string | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};
