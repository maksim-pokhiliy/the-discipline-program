import { type Label } from "@repo/contracts/lms/label";

import { type CreatableOption } from "../creatable-picker";

type LabelPickerChipBaseProps = {
  options: Label[];
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onCreateOption?: (typedName: string) => Promise<CreatableOption | null>;
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
  maxCount?: number | undefined;
};

export type LabelPickerChipProps = LabelPickerChipSingleProps | LabelPickerChipMultiProps;
