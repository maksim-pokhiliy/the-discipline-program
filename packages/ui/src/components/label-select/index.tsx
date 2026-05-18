"use client";

import {
  Autocomplete,
  type AutocompleteRenderInputParams,
  CircularProgress,
  TextField,
} from "@mui/material";

import type { Label } from "@repo/contracts/lms/label";

type LabelSelectBaseProps = {
  options: Label[];
  isLoading: boolean;
  disabled?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
};

type LabelSelectSingleProps = LabelSelectBaseProps & {
  multiple?: false | undefined;
  value: Label | null;
  onChange: (labelId: string | null) => void;
};

type LabelSelectMultiProps = LabelSelectBaseProps & {
  multiple: true;
  value: Label[];
  onChange: (labelIds: string[]) => void;
};

type LabelSelectProps = LabelSelectSingleProps | LabelSelectMultiProps;

const getOptionLabel = (option: Label) => option.name;
const isOptionEqualToValue = (option: Label, val: Label) => option.id === val.id;

export const LabelSelect = (props: LabelSelectProps) => {
  const { options, isLoading, disabled = false, label = "Label", placeholder = "Select…" } = props;

  const renderInput = (params: AutocompleteRenderInputParams) => {
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
  };

  if (props.multiple === true) {
    return (
      <Autocomplete<Label, true>
        multiple
        options={options}
        value={props.value}
        onChange={(_, next) => props.onChange(next.map((item) => item.id))}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        disabled={disabled || isLoading}
        size="small"
        renderInput={renderInput}
      />
    );
  }

  return (
    <Autocomplete<Label, false>
      options={options}
      value={props.value}
      onChange={(_, next) => props.onChange(next?.id ?? null)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      disabled={disabled || isLoading}
      size="small"
      renderInput={renderInput}
    />
  );
};
