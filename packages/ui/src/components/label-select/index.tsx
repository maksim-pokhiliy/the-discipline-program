"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import type { Label } from "@repo/contracts/lms/label";

type LabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
};

const getOptionLabel = (option: Label) => option.name;

export const LabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
  label = "Label",
  placeholder = "Select…",
}: LabelSelectProps) => (
  <Autocomplete<Label>
    options={options}
    value={value}
    onChange={(_, next) => onChange(next?.id ?? null)}
    getOptionLabel={getOptionLabel}
    isOptionEqualToValue={(option, val) => option.id === val.id}
    disabled={disabled || isLoading}
    size="small"
    renderInput={(params) => {
      const {
        size: paramsSize,
        disabled: paramsDisabled,
        fullWidth: paramsFullWidth,
        id: paramsId,
        InputLabelProps,
        inputProps,
        InputProps,
      } = params;

      return (
        <TextField
          {...(paramsSize !== undefined && { size: paramsSize })}
          {...(paramsDisabled !== undefined && { disabled: paramsDisabled })}
          {...(paramsFullWidth !== undefined && { fullWidth: paramsFullWidth })}
          {...(paramsId !== undefined && { id: paramsId })}
          inputProps={inputProps}
          label={label}
          placeholder={placeholder}
          variant="outlined"
          slotProps={{
            inputLabel: InputLabelProps,
            input: {
              ...InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                  {InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      );
    }}
  />
);
