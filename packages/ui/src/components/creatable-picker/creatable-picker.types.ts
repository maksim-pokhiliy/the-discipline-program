export type CreatableOption = {
  id: string;
  label: string;
};

type CreatablePickerBaseProps = {
  options: CreatableOption[];
  inputValue: string;
  onInputChange: (next: string) => void;
  onCreateOption: (typedName: string) => Promise<CreatableOption | null>;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  error?: string | undefined;
  noOptionsText?: string | undefined;
  size?: "small" | "medium" | undefined;
  open?: boolean | undefined;
};

type CreatablePickerSingleProps = CreatablePickerBaseProps & {
  multiple?: false | undefined;
  value: CreatableOption | null;
  onChange: (next: CreatableOption | null) => void;
};

type CreatablePickerMultiProps = CreatablePickerBaseProps & {
  multiple: true;
  value: CreatableOption[];
  onChange: (next: CreatableOption[]) => void;
  maxCount?: number | undefined;
};

export type CreatablePickerProps = CreatablePickerSingleProps | CreatablePickerMultiProps;

export type PickerEntry =
  | { kind: "existing"; option: CreatableOption }
  | { kind: "create"; query: string };

export const isExistingEntry = (
  entry: PickerEntry,
): entry is { kind: "existing"; option: CreatableOption } => entry.kind === "existing";

export const getEntryId = (entry: PickerEntry): string =>
  isExistingEntry(entry) ? entry.option.id : entry.query;

export const getEntryLabel = (entry: PickerEntry): string =>
  isExistingEntry(entry) ? entry.option.label : entry.query;

export const hasExactLabelMatch = (options: CreatableOption[], query: string): boolean => {
  const needle = query.trim().toLowerCase();

  return options.some((option) => option.label.trim().toLowerCase() === needle);
};
