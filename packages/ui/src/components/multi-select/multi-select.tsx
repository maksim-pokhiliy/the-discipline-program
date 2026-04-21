"use client";

import { useMemo, useRef, type ReactNode, type SyntheticEvent } from "react";

import {
  Autocomplete,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
  type FilterOptionsState,
} from "@mui/material";

const SELECT_ALL_SENTINEL = "__multi_select_all__";

type SelectAllSentinel = {
  readonly id: typeof SELECT_ALL_SENTINEL;
};

export type MultiSelectProps<TOption> = {
  options: TOption[];
  value: string[];
  onChange: (next: string[]) => void;
  getOptionId: (option: TOption) => string;
  getOptionLabel: (option: TOption) => string;
  getOptionSubLabel?: (option: TOption) => string | null;
  renderOptionIcon?: (option: TOption) => ReactNode;
  label: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
  selectAllLabel?: string;
  onInputChange?: (next: string) => void;
  inputValue?: string;
  disableSelectAll?: boolean;
};

const SELECT_ALL_OPTION: SelectAllSentinel = { id: SELECT_ALL_SENTINEL };

export const MultiSelect = <TOption,>(props: MultiSelectProps<TOption>) => {
  const {
    options,
    value,
    onChange,
    getOptionId,
    getOptionLabel,
    getOptionSubLabel,
    renderOptionIcon,
    label,
    placeholder,
    helperText,
    errorText,
    isLoading = false,
    disabled = false,
    emptyLabel,
    selectAllLabel,
    onInputChange,
    inputValue,
    disableSelectAll = false,
  } = props;

  type Option = TOption | SelectAllSentinel;

  const isSentinel = (option: Option): option is SelectAllSentinel =>
    (option as { id?: unknown }).id === SELECT_ALL_SENTINEL;

  const getOptionKey = (option: Option): string =>
    isSentinel(option) ? SELECT_ALL_SENTINEL : getOptionId(option);

  const getLabel = (option: Option): string =>
    isSentinel(option) ? (selectAllLabel ?? "Select all") : getOptionLabel(option);

  const selectedIdsSet = useMemo(() => new Set(value), [value]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedIdsSet.has(getOptionId(o))),
    [options, selectedIdsSet, getOptionId],
  );

  const baseFilter = useMemo(
    () =>
      createFilterOptions<TOption>({
        stringify: getOptionLabel,
      }),
    [getOptionLabel],
  );

  const lastFilteredRef = useRef<TOption[]>([]);

  const filterOptions = (opts: Option[], state: FilterOptionsState<Option>): Option[] => {
    const realOptions = opts.filter((o): o is TOption => !isSentinel(o));
    const filtered = baseFilter(realOptions, {
      inputValue: state.inputValue,
      getOptionLabel: getOptionLabel,
    });

    lastFilteredRef.current = filtered;

    if (disableSelectAll || filtered.length === 0) {
      return filtered;
    }

    return [SELECT_ALL_OPTION, ...filtered];
  };

  const handleChange = (_event: SyntheticEvent, next: Option[]): void => {
    if (next.some(isSentinel)) {
      const filtered = lastFilteredRef.current;
      const filteredIds = new Set(filtered.map((o) => getOptionId(o)));
      const allFilteredSelected =
        filtered.length > 0 && filtered.every((o) => selectedIdsSet.has(getOptionId(o)));

      if (allFilteredSelected) {
        onChange(value.filter((id) => !filteredIds.has(id)));

        return;
      }

      const merged = new Set(value);

      for (const option of filtered) {
        merged.add(getOptionId(option));
      }

      onChange(Array.from(merged));

      return;
    }

    const nextIds: string[] = [];

    for (const option of next) {
      if (!isSentinel(option)) {
        nextIds.push(getOptionId(option));
      }
    }

    onChange(nextIds);
  };

  const isControlledInput = inputValue !== undefined && onInputChange !== undefined;

  return (
    <Autocomplete<Option, true, false, false>
      multiple
      disableCloseOnSelect
      limitTags={3}
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      filterOptions={filterOptions}
      isOptionEqualToValue={(a, b) => getOptionKey(a) === getOptionKey(b)}
      getOptionLabel={getLabel}
      noOptionsText={emptyLabel ?? "No options"}
      disabled={disabled}
      {...(isControlledInput
        ? {
            inputValue,
            onInputChange: (_event, next) => onInputChange(next),
          }
        : {})}
      renderOption={(liProps, option, { selected }) => {
        const { key, ...rest } = liProps;

        if (isSentinel(option)) {
          const filtered = lastFilteredRef.current;
          const selectedInFilter = filtered.filter((o) =>
            selectedIdsSet.has(getOptionId(o)),
          ).length;
          const allSelectedInFilter = filtered.length > 0 && selectedInFilter === filtered.length;
          const partiallySelected = selectedInFilter > 0 && !allSelectedInFilter;

          return (
            <Stack
              key={key}
              component="li"
              direction="row"
              spacing={1}
              alignItems="center"
              {...rest}
            >
              <Checkbox
                size="small"
                checked={allSelectedInFilter}
                indeterminate={partiallySelected}
              />
              <Typography variant="subtitle2">{selectAllLabel ?? "Select all"}</Typography>
            </Stack>
          );
        }

        const subLabel = getOptionSubLabel ? getOptionSubLabel(option) : null;

        return (
          <Stack
            key={key}
            component="li"
            direction="row"
            spacing={1.5}
            alignItems="center"
            {...rest}
          >
            <Checkbox size="small" checked={selected} />
            {renderOptionIcon ? renderOptionIcon(option) : null}
            <Stack>
              <Typography variant="body2">{getOptionLabel(option)}</Typography>
              {subLabel !== null && subLabel !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  {subLabel}
                </Typography>
              )}
            </Stack>
          </Stack>
        );
      }}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={getOptionKey(option)}
            label={getLabel(option)}
            size="small"
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={Boolean(errorText)}
          helperText={errorText ?? helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};
