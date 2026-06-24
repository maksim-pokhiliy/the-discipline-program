"use client";

import { useMemo, type SyntheticEvent } from "react";

import {
  Autocomplete,
  Box,
  TextField,
  createFilterOptions,
  type AutocompleteValue,
  type FilterOptionsState,
} from "@mui/material";

import { TagChip } from "../tag-chip";

import {
  getEntryId,
  getEntryLabel,
  hasExactLabelMatch,
  isExistingEntry,
  type CreatableOption,
  type CreatablePickerProps,
  type PickerEntry,
} from "./creatable-picker.types";

const CREATE_OPTION_PREFIX = 'Create "';
const CREATE_OPTION_SUFFIX = '"';
const DEFAULT_NO_OPTIONS_TEXT = "Type to search";

const baseFilter = createFilterOptions<PickerEntry>({
  stringify: getEntryLabel,
});

const appendCreateOption = (
  entries: PickerEntry[],
  state: FilterOptionsState<PickerEntry>,
  options: CreatableOption[],
): PickerEntry[] => {
  const filtered = baseFilter(entries, state);
  const query = state.inputValue.trim();

  if (query === "" || hasExactLabelMatch(options, query)) {
    return filtered;
  }

  return [...filtered, { kind: "create", query }];
};

type ChosenValue = AutocompleteValue<PickerEntry, boolean, false, true>;

const toEntries = (chosen: ChosenValue): PickerEntry[] => {
  const list = Array.isArray(chosen) ? chosen : [chosen];
  const entries: PickerEntry[] = [];

  for (const item of list) {
    if (item === null) {
      continue;
    }

    if (typeof item === "string") {
      const trimmed = item.trim();

      if (trimmed !== "") {
        entries.push({ kind: "create", query: trimmed });
      }
    } else {
      entries.push(item);
    }
  }

  return entries;
};

const dedupeCapped = (options: CreatableOption[], maxCount: number): CreatableOption[] => {
  const seen = new Set<string>();
  const result: CreatableOption[] = [];

  for (const option of options) {
    if (!seen.has(option.id) && result.length < maxCount) {
      seen.add(option.id);
      result.push(option);
    }
  }

  return result;
};

export const CreatablePicker = (props: CreatablePickerProps) => {
  const {
    options,
    inputValue,
    onInputChange,
    onCreateOption,
    loading = false,
    disabled = false,
    label,
    placeholder,
    error,
    noOptionsText = DEFAULT_NO_OPTIONS_TEXT,
    size = "small",
    open,
    renderOption,
  } = props;

  const isMultiple = props.multiple === true;
  const maxCount = props.multiple === true ? props.maxCount : undefined;

  const valueEntries = useMemo<PickerEntry[]>(() => {
    if (props.multiple === true) {
      return props.value.map((option) => ({ kind: "existing", option }));
    }

    return props.value === null ? [] : [{ kind: "existing", option: props.value }];
  }, [props]);

  const optionEntries = useMemo<PickerEntry[]>(() => {
    const fromOptions: PickerEntry[] = options.map((option) => ({ kind: "existing", option }));
    const optionIds = new Set(fromOptions.map(getEntryId));
    const extras = valueEntries.filter((entry) => !optionIds.has(getEntryId(entry)));

    return [...fromOptions, ...extras];
  }, [options, valueEntries]);

  const isAtCap =
    maxCount !== undefined && props.multiple === true && props.value.length >= maxCount;

  const emitSingle = async (chosen: ChosenValue): Promise<void> => {
    if (props.multiple === true) {
      return;
    }

    const entries = toEntries(chosen);
    const last = entries.at(-1) ?? null;

    if (last === null) {
      props.onChange(null);

      return;
    }

    if (isExistingEntry(last)) {
      props.onChange(last.option);

      return;
    }

    const created = await onCreateOption(last.query);

    if (created !== null) {
      props.onChange(created);
    }
  };

  const emitMulti = async (chosen: ChosenValue): Promise<void> => {
    if (props.multiple !== true) {
      return;
    }

    const entries = toEntries(chosen);
    const selected: CreatableOption[] = [];

    for (const entry of entries) {
      if (isExistingEntry(entry)) {
        selected.push(entry.option);

        continue;
      }

      const created = await onCreateOption(entry.query);

      if (created !== null) {
        selected.push(created);
      }
    }

    props.onChange(dedupeCapped(selected, maxCount ?? selected.length));
  };

  const handleChange = (_event: SyntheticEvent, chosen: ChosenValue): void => {
    if (props.multiple === true) {
      void emitMulti(chosen);

      return;
    }

    void emitSingle(chosen);
  };

  return (
    <Autocomplete<PickerEntry, boolean, false, true>
      multiple={isMultiple}
      freeSolo
      openOnFocus
      {...(open !== undefined && { open })}
      disableCloseOnSelect={isMultiple}
      disabled={disabled}
      size={size}
      options={optionEntries}
      value={isMultiple ? valueEntries : (valueEntries[0] ?? null)}
      inputValue={inputValue}
      onInputChange={(_event, next) => onInputChange(next)}
      onChange={handleChange}
      loading={loading}
      filterOptions={(entries, state) => appendCreateOption(entries, state, options)}
      isOptionEqualToValue={(a, b) => getEntryId(a) === getEntryId(b)}
      getOptionLabel={(option) => (typeof option === "string" ? option : getEntryLabel(option))}
      noOptionsText={noOptionsText}
      renderOption={(optionProps, option) => {
        const { key, ...rest } = optionProps;

        if (isExistingEntry(option) && renderOption !== undefined) {
          return (
            <Box component="li" key={key} {...rest}>
              {renderOption(option.option)}
            </Box>
          );
        }

        const optionLabel = isExistingEntry(option)
          ? getEntryLabel(option)
          : `${CREATE_OPTION_PREFIX}${option.query}${CREATE_OPTION_SUFFIX}`;

        return (
          <Box component="li" key={key} {...rest}>
            {optionLabel}
          </Box>
        );
      }}
      renderTags={(tags, getTagProps) =>
        tags.map((option, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          const chipLabel = typeof option === "string" ? option : getEntryLabel(option);

          return <TagChip key={key} label={chipLabel} size="small" preserveCase {...chipProps} />;
        })
      }
      renderInput={(params) => {
        const { InputProps, inputProps, id: paramsId, disabled: paramsDisabled } = params;
        const capHelperText =
          maxCount !== undefined ? `Up to ${String(maxCount)} items` : undefined;
        const helperText = error ?? (isAtCap ? capHelperText : undefined);

        return (
          <TextField
            size={size}
            {...(paramsId !== undefined && { id: paramsId })}
            {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
            {...(label !== undefined && { label })}
            error={error !== undefined}
            {...(!isAtCap && placeholder !== undefined && { placeholder })}
            {...(helperText !== undefined && { helperText })}
            inputProps={isAtCap ? { ...inputProps, readOnly: true } : inputProps}
            slotProps={{ input: InputProps }}
          />
        );
      }}
    />
  );
};
