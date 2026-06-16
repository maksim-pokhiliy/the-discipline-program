"use client";

import { useMemo, useState } from "react";

import type { Modifier } from "@repo/contracts/lms/modifier";
import { SCHEMA_ROW_CONSTANTS } from "@repo/contracts/lms/schema-row";
import { CreatablePicker, type CreatableOption } from "@repo/ui";

import { useCreateModifier } from "@app/lib/hooks/use-create-modifier";
import { useDebouncedValue } from "@app/lib/hooks/use-debounced-value";
import { useModifierSearch } from "@app/lib/hooks/use-modifier-search";

import { buildResolvedNameMap, type CreatableMultiPickerProps } from "./modifier-picker.types";

const DEFAULT_LABEL = "Modifiers";
const DEFAULT_PLACEHOLDER = "Search or create a modifier";
const SEARCH_DEBOUNCE_MS = 250;
const NO_OPTIONS_TEXT = "Type to search modifiers";

export const ModifierPicker = ({
  value,
  onChange,
  resolvedRefs,
  maxCount = SCHEMA_ROW_CONSTANTS.MAX_MODIFIERS_PER_ROW,
  label = DEFAULT_LABEL,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
  error,
}: CreatableMultiPickerProps) => {
  const [inputValue, setInputValue] = useState("");
  const [mintedNames, setMintedNames] = useState<ReadonlyMap<string, string>>(() => new Map());
  const debouncedQuery = useDebouncedValue(inputValue.trim(), SEARCH_DEBOUNCE_MS);
  const searchQuery = useModifierSearch(debouncedQuery === "" ? undefined : debouncedQuery);
  const createModifier = useCreateModifier();

  const searchResults = useMemo<Modifier[]>(() => searchQuery.data ?? [], [searchQuery.data]);

  const nameById = useMemo(() => {
    const byId = buildResolvedNameMap(searchResults, resolvedRefs ?? []);

    for (const [id, name] of mintedNames) {
      byId.set(id, name);
    }

    return byId;
  }, [searchResults, resolvedRefs, mintedNames]);

  const options = useMemo<CreatableOption[]>(
    () => searchResults.map((modifier) => ({ id: modifier.id, label: modifier.name })),
    [searchResults],
  );

  const selected = useMemo<CreatableOption[]>(
    () => value.map((id) => ({ id, label: nameById.get(id) ?? id })),
    [value, nameById],
  );

  const handleCreate = async (name: string): Promise<CreatableOption | null> => {
    const minted = await createModifier.mutateAsync({ name, notes: null }).catch(() => null);

    if (minted === null) {
      return null;
    }

    setMintedNames((prev) => {
      const next = new Map(prev);

      next.set(minted.id, minted.name);

      return next;
    });

    return { id: minted.id, label: minted.name };
  };

  return (
    <CreatablePicker
      multiple
      maxCount={maxCount}
      options={options}
      value={selected}
      onChange={(next) => onChange(next.map((option) => option.id))}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onCreateOption={handleCreate}
      loading={searchQuery.isFetching}
      disabled={disabled}
      label={label}
      placeholder={placeholder}
      noOptionsText={NO_OPTIONS_TEXT}
      {...(error !== undefined && { error })}
    />
  );
};
