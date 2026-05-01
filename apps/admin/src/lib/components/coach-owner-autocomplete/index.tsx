"use client";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import { type CoachListItem } from "@repo/contracts/iam/user";

import { useCoachesList } from "@app/lib/hooks";

type CoachOwnerAutocompleteProps = {
  value: string | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  helperText?: string | undefined;
  label?: string | undefined;
};

const getOptionLabel = (option: CoachListItem) => option.name ?? option.email;

export const CoachOwnerAutocomplete = ({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  label = "New owner",
}: CoachOwnerAutocompleteProps) => {
  const { data: coaches = [], isLoading } = useCoachesList();
  const selected = coaches.find((c) => c.userId === value) ?? null;

  return (
    <Autocomplete<CoachListItem>
      options={coaches}
      value={selected}
      onChange={(_, next) => onChange(next?.userId ?? null)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.userId === val.userId}
      disabled={disabled || isLoading}
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
            variant="outlined"
            error={error}
            {...(helperText !== undefined && { helperText })}
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
};
