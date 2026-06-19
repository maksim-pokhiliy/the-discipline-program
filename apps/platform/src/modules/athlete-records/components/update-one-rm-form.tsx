"use client";

import { useMemo, useState, type ReactElement, type SyntheticEvent } from "react";

import {
  Autocomplete,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useQueryClient } from "@tanstack/react-query";
import { isValid } from "date-fns";

import { OneRMRecordSource, ONE_RM_RECORD_SOURCE_LABELS } from "@repo/contracts/lms/one-rm-record";

import { platformKeys } from "@app/lib/api/keys";
import { useCreateOneRMRecord } from "@app/lib/hooks/use-one-rm-records";

const MOVEMENT_LABEL = "Movement";
const VALUE_LABEL = "Value (kg)";
const DATE_LABEL = "Date";
const CANCEL_LABEL = "Cancel";
const SAVE_LABEL = "Save Record";
const VALUE_INPUT_MODE = "numeric";
const FORM_GAP = 2;
const SOURCE_GAP = 1;
const ACTIONS_GAP = 1;
const DEFAULT_SOURCE = OneRMRecordSource.TESTED;
const PICKABLE_SOURCES = [OneRMRecordSource.TESTED, OneRMRecordSource.MANUAL] as const;

export type OneRmMovementOption = {
  exerciseId: string;
  exerciseName: string;
};

const recordedAtForDay = (date: Date): Date => {
  const now = new Date();

  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
};

const parseValue = (raw: string): number | null => {
  const parsed = Number(raw.trim());

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export type UpdateOneRmFormProps = {
  presetExerciseId?: string | undefined;
  movements: OneRmMovementOption[];
  onClose: () => void;
};

export const UpdateOneRmForm = ({
  presetExerciseId,
  movements,
  onClose,
}: UpdateOneRmFormProps): ReactElement => {
  const queryClient = useQueryClient();
  const createOneRm = useCreateOneRMRecord();

  const presetMovement = useMemo(
    () => movements.find((option) => option.exerciseId === presetExerciseId) ?? null,
    [movements, presetExerciseId],
  );

  const [movement, setMovement] = useState<OneRmMovementOption | null>(presetMovement);
  const [value, setValue] = useState("");
  const [date, setDate] = useState<Date | null>(() => new Date());
  const [source, setSource] = useState<OneRMRecordSource>(DEFAULT_SOURCE);

  const activeMovement = movement ?? presetMovement;
  const parsedValue = parseValue(value);
  const hasDate = date !== null && isValid(date);
  const canSubmit =
    activeMovement !== null && parsedValue !== null && hasDate && !createOneRm.isPending;

  const handleSource = (_event: SyntheticEvent, next: OneRMRecordSource | null): void => {
    if (next !== null) {
      setSource(next);
    }
  };

  const handleSubmit = (): void => {
    if (activeMovement === null || parsedValue === null || date === null || createOneRm.isPending) {
      return;
    }

    createOneRm.mutate(
      {
        exerciseId: activeMovement.exerciseId,
        valueKg: parsedValue,
        recordedAt: recordedAtForDay(date),
        source,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: platformKeys.athleteRecords.data() });
          onClose();
        },
      },
    );
  };

  return (
    <Stack spacing={FORM_GAP}>
      <Autocomplete<OneRmMovementOption>
        options={movements}
        value={activeMovement}
        onChange={(_event, next) => setMovement(next)}
        getOptionLabel={(option) => option.exerciseName}
        isOptionEqualToValue={(a, b) => a.exerciseId === b.exerciseId}
        renderInput={(params) => {
          const { InputProps, inputProps, InputLabelProps, id } = params;

          return (
            <TextField
              {...(id !== undefined && { id })}
              label={MOVEMENT_LABEL}
              slotProps={{ input: InputProps, htmlInput: inputProps, inputLabel: InputLabelProps }}
            />
          );
        }}
      />

      <TextField
        label={VALUE_LABEL}
        type="number"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        fullWidth
        slotProps={{ htmlInput: { inputMode: VALUE_INPUT_MODE, min: 0 } }}
      />

      <DatePicker
        label={DATE_LABEL}
        value={date}
        onChange={(next) => setDate(next)}
        slotProps={{ textField: { fullWidth: true } }}
      />

      <ToggleButtonGroup exclusive value={source} onChange={handleSource} fullWidth size="small">
        {PICKABLE_SOURCES.map((option) => (
          <ToggleButton key={option} value={option} sx={{ flex: 1, gap: SOURCE_GAP }}>
            {ONE_RM_RECORD_SOURCE_LABELS[option]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack direction="row" spacing={ACTIONS_GAP} justifyContent="flex-end">
        <Button variant="text" color="inherit" onClick={onClose}>
          {CANCEL_LABEL}
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {SAVE_LABEL}
        </Button>
      </Stack>
    </Stack>
  );
};
