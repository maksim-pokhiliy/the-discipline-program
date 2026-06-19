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
import { useQueryClient } from "@tanstack/react-query";

import { type Exercise } from "@repo/contracts/lms/exercise";
import { OneRMRecordSource, ONE_RM_RECORD_SOURCE_LABELS } from "@repo/contracts/lms/one-rm-record";

import { platformKeys } from "@app/lib/api/keys";
import { useExercises } from "@app/lib/hooks/use-exercises";
import { useCreateOneRMRecord } from "@app/lib/hooks/use-one-rm-records";

const MOVEMENT_LABEL = "Movement";
const VALUE_LABEL = "Value (kg)";
const DATE_LABEL = "Date";
const CANCEL_LABEL = "Cancel";
const SAVE_LABEL = "Save";
const VALUE_INPUT_MODE = "numeric";
const ISO_DATE_LENGTH = 10;
const FORM_GAP = 2;
const SOURCE_GAP = 1;
const ACTIONS_GAP = 1;
const DEFAULT_SOURCE = OneRMRecordSource.TESTED;
const PICKABLE_SOURCES = [OneRMRecordSource.TESTED, OneRMRecordSource.MANUAL] as const;

const todayUtcDate = (): string => new Date().toISOString().slice(0, ISO_DATE_LENGTH);

const parseValue = (raw: string): number | null => {
  const parsed = Number(raw.trim());

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export type UpdateOneRmFormProps = {
  presetExerciseId?: string | undefined;
  onClose: () => void;
};

export const UpdateOneRmForm = ({
  presetExerciseId,
  onClose,
}: UpdateOneRmFormProps): ReactElement => {
  const queryClient = useQueryClient();
  const exercises = useExercises();
  const createOneRm = useCreateOneRMRecord();

  const options = useMemo(() => exercises.data ?? [], [exercises.data]);
  const presetMovement = useMemo(
    () => options.find((option) => option.id === presetExerciseId) ?? null,
    [options, presetExerciseId],
  );

  const [movement, setMovement] = useState<Exercise | null>(presetMovement);
  const [value, setValue] = useState("");
  const [dateStr, setDateStr] = useState(todayUtcDate);
  const [source, setSource] = useState<OneRMRecordSource>(DEFAULT_SOURCE);

  const activeMovement = movement ?? presetMovement;
  const parsedValue = parseValue(value);
  const canSubmit = activeMovement !== null && parsedValue !== null && !createOneRm.isPending;

  const handleSource = (_event: SyntheticEvent, next: OneRMRecordSource | null): void => {
    if (next !== null) {
      setSource(next);
    }
  };

  const handleSubmit = (): void => {
    if (activeMovement === null || parsedValue === null || createOneRm.isPending) {
      return;
    }

    createOneRm.mutate(
      {
        exerciseId: activeMovement.id,
        valueKg: parsedValue,
        recordedAt: new Date(`${dateStr}T00:00:00.000Z`),
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
      <Autocomplete<Exercise>
        options={options}
        value={activeMovement}
        onChange={(_event, next) => setMovement(next)}
        getOptionLabel={(option) => option.canonicalName}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        loading={exercises.isLoading}
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

      <TextField
        label={DATE_LABEL}
        type="date"
        value={dateStr}
        onChange={(event) => setDateStr(event.target.value)}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
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
