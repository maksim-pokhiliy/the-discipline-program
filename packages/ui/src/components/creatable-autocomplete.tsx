"use client";

import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";

import AddIcon from "@mui/icons-material/Add";
import {
  Autocomplete,
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  createFilterOptions,
} from "@mui/material";

interface CreateOption {
  __create: true;
  inputValue: string;
}

type OptionOrCreate<T> = T | CreateOption;

const isCreateOption = <T,>(option: OptionOrCreate<T>): option is CreateOption => {
  return typeof option === "object" && option !== null && "__create" in option;
};

export interface CreatableAutocompleteProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  onCreate: (inputValue: string) => Promise<T>;
  getOptionLabel: (option: T) => string;
  isOptionEqualToValue: (option: T, value: T) => boolean;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  size?: "small" | "medium";
}

export const CreatableAutocomplete = <T,>({
  options,
  value,
  onChange,
  onCreate,
  getOptionLabel,
  isOptionEqualToValue,
  label,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  size = "small",
}: CreatableAutocompleteProps<T>) => {
  const [isCreating, setIsCreating] = useState(false);

  const filter = useMemo(
    () =>
      createFilterOptions<OptionOrCreate<T>>({
        stringify: (option) =>
          isCreateOption(option) ? option.inputValue : getOptionLabel(option),
      }),
    [getOptionLabel],
  );

  const handleChange = async (_: SyntheticEvent, newValue: OptionOrCreate<T> | null) => {
    if (newValue && isCreateOption(newValue)) {
      setIsCreating(true);

      try {
        const created = await onCreate(newValue.inputValue);

        onChange(created);
      } finally {
        setIsCreating(false);
      }

      return;
    }

    onChange(newValue);
  };

  return (
    <Autocomplete<OptionOrCreate<T>>
      value={value as OptionOrCreate<T> | null}
      onChange={handleChange}
      options={options as OptionOrCreate<T>[]}
      getOptionLabel={(option) => {
        if (isCreateOption(option)) {
          return option.inputValue;
        }

        return getOptionLabel(option);
      }}
      isOptionEqualToValue={(option, val) => {
        if (isCreateOption(option) || isCreateOption(val)) {
          return false;
        }

        return isOptionEqualToValue(option, val);
      }}
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params);
        const { inputValue } = params;

        if (inputValue.trim()) {
          const exists = options.some(
            (opt) => getOptionLabel(opt).toLowerCase() === inputValue.trim().toLowerCase(),
          );

          if (!exists) {
            filtered.push({ __create: true, inputValue: inputValue.trim() });
          }
        }

        return filtered;
      }}
      renderOption={({ key, ...props }, option) => {
        if (isCreateOption(option)) {
          return (
            <ListItem key="__create__" {...props}>
              <ListItemIcon sx={(theme) => ({ minWidth: theme.spacing(4.5) })}>
                <AddIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={`Add "${option.inputValue}"`}
                primaryTypographyProps={{ color: "primary" }}
              />
            </ListItem>
          );
        }

        return (
          <ListItem key={key} {...props}>
            <ListItemText primary={getOptionLabel(option)} />
          </ListItem>
        );
      }}
      disabled={disabled || isCreating}
      loading={isCreating}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={size}
          error={error}
          helperText={helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {isCreating && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      fullWidth
    />
  );
};
