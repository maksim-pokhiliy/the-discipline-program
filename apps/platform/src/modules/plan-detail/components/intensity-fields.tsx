"use client";

import { MenuItem, Stack, TextField } from "@mui/material";

import { HR_ZONES, type Intensity, PACE_VALUES } from "@repo/contracts/lms/_shared";

const FIELD_GAP = 1.5;
const RPE_MAX = 10;
const RPE_STEP = 0.5;
const EFFORT_MAX = 100;
const NUMBER_FIELD_WIDTH = 96;
const SELECT_FIELD_WIDTH = 132;
const EMPTY_OPTION = "—";

type IntensityFieldsProps = {
  value: Intensity | null;
  onChange: (next: Intensity | null) => void;
  disabled?: boolean;
};

const compact = (next: Intensity): Intensity | null => {
  const cleaned: Intensity = {};

  if (next.rpe !== undefined) {
    cleaned.rpe = next.rpe;
  }

  if (next.hrZone !== undefined) {
    cleaned.hrZone = next.hrZone;
  }

  if (next.effortPercent !== undefined) {
    cleaned.effortPercent = next.effortPercent;
  }

  if (next.pace !== undefined) {
    cleaned.pace = next.pace;
  }

  if (next.numericPace !== undefined) {
    cleaned.numericPace = next.numericPace;
  }

  const hasAny =
    cleaned.rpe ?? cleaned.hrZone ?? cleaned.effortPercent ?? cleaned.pace ?? cleaned.numericPace;

  return hasAny !== undefined ? cleaned : null;
};

const toNumber = (raw: string): number | undefined => {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
};

export const IntensityFields: React.FC<IntensityFieldsProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const current = value ?? {};

  const patch = (next: Partial<Intensity>): void => onChange(compact({ ...current, ...next }));

  const effortValue =
    current.effortPercent !== undefined && "value" in current.effortPercent
      ? current.effortPercent.value
      : "";

  return (
    <Stack direction="row" spacing={FIELD_GAP} sx={{ flexWrap: "wrap", alignItems: "flex-start" }}>
      <TextField
        type="number"
        size="small"
        label="RPE"
        value={current.rpe?.value ?? ""}
        onChange={(event) => {
          const parsed = toNumber(event.target.value);

          patch({ rpe: parsed === undefined ? undefined : { value: parsed } });
        }}
        inputProps={{ min: 0, max: RPE_MAX, step: RPE_STEP }}
        disabled={disabled}
        sx={{ width: NUMBER_FIELD_WIDTH }}
      />

      <TextField
        select
        size="small"
        label="HR zone"
        value={current.hrZone?.zone ?? ""}
        onChange={(event) => {
          const zone = HR_ZONES.find((candidate) => candidate === event.target.value);

          patch({ hrZone: zone === undefined ? undefined : { zone } });
        }}
        disabled={disabled}
        sx={{ width: SELECT_FIELD_WIDTH }}
      >
        <MenuItem value="">{EMPTY_OPTION}</MenuItem>

        {HR_ZONES.map((zone) => (
          <MenuItem key={zone} value={zone}>
            {zone}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        type="number"
        size="small"
        label="Effort %"
        value={effortValue}
        onChange={(event) => {
          const parsed = toNumber(event.target.value);

          patch({ effortPercent: parsed === undefined ? undefined : { value: parsed } });
        }}
        inputProps={{ min: 0, max: EFFORT_MAX, step: 1 }}
        disabled={disabled}
        sx={{ width: NUMBER_FIELD_WIDTH }}
      />

      <TextField
        select
        size="small"
        label="Pace"
        value={current.pace ?? ""}
        onChange={(event) => {
          const pace = PACE_VALUES.find((candidate) => candidate === event.target.value);

          patch({ pace });
        }}
        disabled={disabled}
        sx={{ width: SELECT_FIELD_WIDTH }}
      >
        <MenuItem value="">{EMPTY_OPTION}</MenuItem>

        {PACE_VALUES.map((pace) => (
          <MenuItem key={pace} value={pace}>
            {pace}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
};
