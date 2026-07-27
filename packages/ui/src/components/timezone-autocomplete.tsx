"use client";

import { useMemo } from "react";

import { Autocomplete, TextField } from "@mui/material";

const formatOffset = (timeZone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === "timeZoneName")?.value;

    return offset ? `${timeZone} (${offset})` : timeZone;
  } catch {
    return timeZone;
  }
};

const buildOptions = (): string[] => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC"];
  }
};

type TimezoneAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  error?: boolean | undefined;
  helperText?: string | undefined;
  label?: string | undefined;
};

export const TimezoneAutocomplete = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  label = "Timezone",
}: TimezoneAutocompleteProps) => {
  const options = useMemo(buildOptions, []);
  const labelMap = useMemo(() => {
    const map = new Map<string, string>();

    for (const tz of options) {
      map.set(tz, formatOffset(tz));
    }

    return map;
  }, [options]);

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_event, newValue) => onChange(newValue ?? "")}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      disableClearable
      autoHighlight
      getOptionLabel={(option) => labelMap.get(option) ?? option}
      isOptionEqualToValue={(option, selected) => option === selected}
      renderInput={(params) => {
        const {
          size: paramsSize,
          disabled: paramsDisabled,
          id: paramsId,
          InputLabelProps,
          inputProps,
          InputProps,
        } = params;

        return (
          <TextField
            {...(paramsSize !== undefined && { size: paramsSize })}
            {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
            {...(paramsId !== undefined && { id: paramsId })}
            inputProps={inputProps}
            label={label}
            variant="outlined"
            fullWidth
            error={error}
            {...(helperText !== undefined && { helperText })}
            slotProps={{
              inputLabel: InputLabelProps,
              input: InputProps,
            }}
          />
        );
      }}
    />
  );
};
