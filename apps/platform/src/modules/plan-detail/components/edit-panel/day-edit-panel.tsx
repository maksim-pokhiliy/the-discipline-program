"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { type z } from "zod";

import { type DayType } from "@repo/contracts/lms/day-type";
import {
  type PlanDay,
  type UpdatePlanDayRequest,
  updatePlanDayRequestSchema,
} from "@repo/contracts/lms/plan-day";

import { useUpdatePlanDay, useUpsertPlanDay } from "@app/lib/hooks";

import { toErrorMessage } from "../../lib/to-error-message";
import { useSubmitGuard } from "../../lib/use-submit-guard";

import { EditPanel } from "./edit-panel";
import { type SaveStatusChange } from "./edit-panel-status";

type DayEditPanelLookups = { readonly dayTypes: ReadonlyMap<string, DayType> };

type DayEditPanelProps = {
  planId: string;
  date: Date;
  dayId: string | null;
  existingDay?: PlanDay | null;
  lookups: DayEditPanelLookups;
  onClose: () => void;
  onStatusChange?: SaveStatusChange;
};

type DayFormInput = z.input<typeof updatePlanDayRequestSchema>;

const NO_DAY_TYPE_VALUE = "";

const buildDefaults = (existingDay: PlanDay | null | undefined): DayFormInput => ({
  dayTypeId: existingDay?.dayTypeId ?? null,
});

export const DayEditPanel: React.FC<DayEditPanelProps> = ({
  planId,
  date,
  dayId,
  existingDay,
  lookups,
  onClose,
  onStatusChange,
}) => {
  const upsertDay = useUpsertPlanDay({ planId });
  const updateDay = useUpdatePlanDay({ planId });

  const form = useForm<DayFormInput, unknown, UpdatePlanDayRequest>({
    resolver: zodResolver(updatePlanDayRequestSchema),
    defaultValues: buildDefaults(existingDay),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = form;

  const isSaving = upsertDay.isPending || updateDay.isPending;
  const dayTypeOptions = Array.from(lookups.dayTypes.values());

  const submitData = async (data: UpdatePlanDayRequest): Promise<void> => {
    const dayTypeId = data.dayTypeId ?? null;
    const submittedValues: DayFormInput = { dayTypeId };

    onStatusChange?.("saving");

    try {
      if (dayId === null) {
        await upsertDay.mutateAsync({ date, dayTypeId });
      } else {
        await updateDay.mutateAsync({ id: dayId, data: { dayTypeId } });
      }

      reset(submittedValues);
      onStatusChange?.("saved");
      onClose();
    } catch (error) {
      onStatusChange?.("error", {
        message: toErrorMessage(error),
        retry: () => submitData(data),
      });
    }
  };

  const onSubmit = useSubmitGuard(handleSubmit(submitData));

  const title = dayId === null ? "Add day" : "Edit day";

  return (
    <EditPanel
      open
      onClose={onClose}
      title={title}
      isSaving={isSaving}
      canSave={isDirty && Object.keys(errors).length === 0}
      onSave={() => void onSubmit()}
      onCancel={onClose}
    >
      <Stack spacing={3}>
        <Controller
          name="dayTypeId"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl fullWidth size="small" error={Boolean(fieldState.error)}>
              <InputLabel id="day-type-label">Day type</InputLabel>
              <Select
                labelId="day-type-label"
                label="Day type"
                value={field.value ?? NO_DAY_TYPE_VALUE}
                onChange={(event) => {
                  const next = event.target.value;

                  field.onChange(next === NO_DAY_TYPE_VALUE ? null : next);
                }}
                onBlur={field.onBlur}
                disabled={isSaving}
              >
                <MenuItem value={NO_DAY_TYPE_VALUE}>
                  <em>No day type</em>
                </MenuItem>
                {dayTypeOptions.map((dayType) => (
                  <MenuItem key={dayType.id} value={dayType.id}>
                    {dayType.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldState.error?.message !== undefined && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Stack>
    </EditPanel>
  );
};
