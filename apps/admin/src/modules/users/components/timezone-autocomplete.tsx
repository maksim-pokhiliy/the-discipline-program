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
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
};

export const TimezoneAutocomplete = ({
  value,
  onChange,
  onBlur,
  disabled = false,
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
      disableClearable
      autoHighlight
      getOptionLabel={(option) => labelMap.get(option) ?? option}
      isOptionEqualToValue={(option, selected) => option === selected}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          fullWidth
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
};
