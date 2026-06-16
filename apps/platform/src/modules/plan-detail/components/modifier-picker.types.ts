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
