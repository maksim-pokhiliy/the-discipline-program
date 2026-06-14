"use client";

import { useMemo } from "react";

import { Autocomplete, Chip, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type Equipment } from "@repo/contracts/lms/equipment";
import { type CreateExerciseData } from "@repo/contracts/lms/exercise";

import { useEquipmentPageData } from "@app/lib/hooks";

type EquipmentMultiSelectProps = {
  isLoading: boolean;
};

export const EquipmentMultiSelect = ({ isLoading }: EquipmentMultiSelectProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateExerciseData>();

  const { data, isLoading: isOptionsLoading } = useEquipmentPageData();

  const options = useMemo(() => data?.equipment ?? [], [data]);
  const optionById = useMemo(() => {
    const map = new Map<string, Equipment>();

    for (const item of options) {
      map.set(item.id, item);
    }

    return map;
  }, [options]);

  return (
    <Controller
      name="equipmentIds"
      control={control}
      render={({ field }) => {
        const selected = (field.value ?? [])
          .map((id) => optionById.get(id))
          .filter((item): item is Equipment => item !== undefined);

        return (
          <Autocomplete
            multiple
            options={options}
            value={selected}
            loading={isOptionsLoading}
            disabled={isLoading}
            onChange={(_event, next) => field.onChange(next.map((item) => item.id))}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, picked) => option.id === picked.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });

                return <Chip {...tagProps} key={key} label={option.name} size="small" />;
              })
            }
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
                  label="Equipment"
                  placeholder="Add implements"
                  error={!!errors.equipmentIds}
                  helperText={errors.equipmentIds?.message ?? "Implements this movement uses"}
                  slotProps={{
                    inputLabel: InputLabelProps,
                    input: InputProps,
                  }}
                />
              );
            }}
          />
        );
      }}
    />
  );
};
