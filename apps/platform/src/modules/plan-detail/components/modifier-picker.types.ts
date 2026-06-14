import type { Modifier, ModifierRef } from "@repo/contracts/lms/modifier";

export type CreatableMultiPickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
  resolvedRefs?: ModifierRef[] | undefined;
  maxCount?: number | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  error?: string | undefined;
};

export type ModifierOption =
  | { kind: "existing"; modifier: Modifier }
  | { kind: "create"; query: string };

export const isExistingOption = (
  option: ModifierOption,
): option is { kind: "existing"; modifier: Modifier } => option.kind === "existing";

export const getOptionId = (option: ModifierOption): string =>
  isExistingOption(option) ? option.modifier.id : option.query;

export const getOptionLabel = (option: ModifierOption): string =>
  isExistingOption(option) ? option.modifier.name : option.query;

export const buildResolvedNameMap = (
  searchResults: Modifier[],
  resolvedRefs: ModifierRef[],
): Map<string, string> => {
  const byId = new Map<string, string>();

  for (const ref of resolvedRefs) {
    byId.set(ref.id, ref.name);
  }

  for (const modifier of searchResults) {
    byId.set(modifier.id, modifier.name);
  }

  return byId;
};

export const buildValueOptions = (
  value: string[],
  nameById: Map<string, string>,
): ModifierOption[] =>
  value.map((id) => ({
    kind: "existing",
    modifier: {
      id,
      name: nameById.get(id) ?? id,
      nameLower: (nameById.get(id) ?? id).toLowerCase(),
      notes: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
  }));

export const hasExactNameMatch = (options: Modifier[], query: string): boolean => {
  const needle = query.trim().toLowerCase();

  return options.some((option) => option.nameLower === needle);
};
