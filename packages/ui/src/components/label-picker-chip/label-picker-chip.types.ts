import { type AppLevelValue, type Label } from "@repo/contracts/lms/label";

type LabelPickerChipBaseProps = {
  options: Label[];
  level: AppLevelValue;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

type LabelPickerChipSingleProps = LabelPickerChipBaseProps & {
  multiple?: false | undefined;
  value: Label | null;
  onChange: (labelId: string | null) => void;
};

type LabelPickerChipMultiProps = LabelPickerChipBaseProps & {
  multiple: true;
  value: Label[];
  onChange: (labelIds: string[]) => void;
};

export type LabelPickerChipProps = LabelPickerChipSingleProps | LabelPickerChipMultiProps;
