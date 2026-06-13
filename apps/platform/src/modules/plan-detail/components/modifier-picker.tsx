"use client";

import { useMemo, useState, type SyntheticEvent } from "react";

import {
  Autocomplete,
  Chip,
  TextField,
  createFilterOptions,
  type AutocompleteValue,
  type FilterOptionsState,
} from "@mui/material";

import type { Modifier } from "@repo/contracts/lms/modifier";
import { SCHEMA_ROW_CONSTANTS } from "@repo/contracts/lms/schema-row";

import { useCreateModifier } from "@app/lib/hooks/use-create-modifier";
import { useDebouncedValue } from "@app/lib/hooks/use-debounced-value";
import { useModifierSearch } from "@app/lib/hooks/use-modifier-search";

import {
  buildResolvedNameMap,
  buildValueOptions,
  getOptionId,
  getOptionLabel,
  hasExactNameMatch,
  isExistingOption,
  type CreatableMultiPickerProps,
  type ModifierOption,
} from "./modifier-picker.types";

const DEFAULT_LABEL = "Modifiers";
const DEFAULT_PLACEHOLDER = "Search or create a modifier";
const SEARCH_DEBOUNCE_MS = 250;
const CREATE_OPTION_PREFIX = 'Create "';
const CREATE_OPTION_SUFFIX = '"';
const NO_OPTIONS_TEXT = "Type to search modifiers";

const baseFilter = createFilterOptions<ModifierOption>({
  stringify: getOptionLabel,
});

const appendCreateOption = (
  options: ModifierOption[],
  state: FilterOptionsState<ModifierOption>,
  searchResults: Modifier[],
): ModifierOption[] => {
  const filtered = baseFilter(options, state);
  const query = state.inputValue.trim();

  if (query === "" || hasExactNameMatch(searchResults, query)) {
    return filtered;
  }

  return [...filtered, { kind: "create", query }];
};

type ChosenValue = AutocompleteValue<ModifierOption, true, false, true>;

const collectExistingIds = (chosen: ChosenValue): string[] => {
  const ids: string[] = [];

  for (const entry of chosen) {
    if (typeof entry !== "string" && isExistingOption(entry)) {
      ids.push(entry.modifier.id);
    }
  }

  return ids;
};

const collectCreateQueries = (chosen: ChosenValue): string[] => {
  const queries: string[] = [];

  for (const entry of chosen) {
    if (typeof entry === "string") {
      const trimmed = entry.trim();

      if (trimmed !== "") {
        queries.push(trimmed);
      }
    } else if (!isExistingOption(entry)) {
      queries.push(entry.query);
    }
  }

  return queries;
};

const dedupeCapped = (ids: string[], maxCount: number): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of ids) {
    if (!seen.has(id) && result.length < maxCount) {
      seen.add(id);
      result.push(id);
    }
  }

  return result;
};

export const ModifierPicker = ({
  value,
  onChange,
  resolvedRefs,
  maxCount = SCHEMA_ROW_CONSTANTS.MAX_MODIFIERS_PER_ROW,
  label = DEFAULT_LABEL,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
}: CreatableMultiPickerProps) => {
  const [inputValue, setInputValue] = useState("");
  const debouncedQuery = useDebouncedValue(inputValue.trim(), SEARCH_DEBOUNCE_MS);
  const searchQuery = useModifierSearch(debouncedQuery === "" ? undefined : debouncedQuery);
  const createModifier = useCreateModifier();

  const searchResults = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);
  const isAtCap = value.length >= maxCount;

  const nameById = useMemo(
    () => buildResolvedNameMap(searchResults, resolvedRefs ?? []),
    [searchResults, resolvedRefs],
  );
  const valueOptions = useMemo(() => buildValueOptions(value, nameById), [value, nameById]);

  const handleChange = async (_event: SyntheticEvent, chosen: ChosenValue): Promise<void> => {
    const existingIds = collectExistingIds(chosen);
    const createQueries = collectCreateQueries(chosen);

    if (createQueries.length === 0) {
      onChange(dedupeCapped(existingIds, maxCount));

      return;
    }

    const mintedIds: string[] = [];

    for (const query of createQueries) {
      const minted = await createModifier.mutateAsync({ name: query, notes: null });

      mintedIds.push(minted.id);
    }

    onChange(dedupeCapped([...existingIds, ...mintedIds], maxCount));
  };

  return (
    <Autocomplete<ModifierOption, true, false, true>
      multiple
      freeSolo
      disableCloseOnSelect
      disabled={disabled}
      options={valueOptions}
      value={valueOptions}
      inputValue={inputValue}
      onInputChange={(_event, next) => setInputValue(next)}
      onChange={(event, chosen) => {
        void handleChange(event, chosen);
      }}
      loading={searchQuery.isFetching}
      filterOptions={(options, state) => appendCreateOption(options, state, searchResults)}
      isOptionEqualToValue={(a, b) => getOptionId(a) === getOptionId(b)}
      getOptionLabel={(option) => (typeof option === "string" ? option : getOptionLabel(option))}
      noOptionsText={NO_OPTIONS_TEXT}
      renderOption={(optionProps, option) => {
        const { key, ...rest } = optionProps;
        const optionLabel = isExistingOption(option)
          ? getOptionLabel(option)
          : `${CREATE_OPTION_PREFIX}${option.query}${CREATE_OPTION_SUFFIX}`;

        return (
          <li key={key} {...rest}>
            {optionLabel}
          </li>
        );
      }}
      renderTags={(tags, getTagProps) =>
        tags.map((option, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          const chipLabel = typeof option === "string" ? option : getOptionLabel(option);

          return <Chip key={key} variant="tag" size="small" label={chipLabel} {...chipProps} />;
        })
      }
      renderInput={(params) => {
        const { InputProps, inputProps, id: paramsId, disabled: paramsDisabled } = params;
        const capHelperText = `Up to ${maxCount} modifiers`;

        return (
          <TextField
            {...(paramsId !== undefined && { id: paramsId })}
            {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
            label={label}
            {...(!isAtCap && { placeholder })}
            {...(isAtCap && { helperText: capHelperText })}
            inputProps={isAtCap ? { ...inputProps, readOnly: true } : inputProps}
            slotProps={{ input: InputProps }}
          />
        );
      }}
    />
  );
};
