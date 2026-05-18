"use client";

import { Chip, Stack } from "@mui/material";

import type { Intensity } from "@repo/contracts/lms/_shared";

type BlockIntensitySummaryProps = {
  intensity: Intensity | null;
};

const formatEffortPercent = (ep: NonNullable<Intensity["effortPercent"]>): string => {
  if ("value" in ep) {
    return `${ep.value}% effort`;
  }

  return `${ep.range.min}-${ep.range.max}% effort`;
};

const formatRpe = (r: NonNullable<Intensity["rpe"]>): string => `RPE ${r.value}`;

const formatHrZone = (h: NonNullable<Intensity["hrZone"]>): string => h.zone;

const formatNumericPace = (n: NonNullable<Intensity["numericPace"]>): string => {
  const direction = n.paceType === "min_per_distance" ? "/" : " per ";

  return `${n.value}${direction}${n.distanceUnit}`;
};

export const BlockIntensitySummary = ({ intensity }: BlockIntensitySummaryProps) => {
  if (intensity === null) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {intensity.effortPercent !== undefined && (
        <Chip size="small" label={formatEffortPercent(intensity.effortPercent)} />
      )}
      {intensity.rpe !== undefined && <Chip size="small" label={formatRpe(intensity.rpe)} />}
      {intensity.pace !== undefined && <Chip size="small" label={intensity.pace} />}
      {intensity.hrZone !== undefined && (
        <Chip size="small" label={formatHrZone(intensity.hrZone)} />
      )}
      {intensity.numericPace !== undefined && (
        <Chip size="small" label={formatNumericPace(intensity.numericPace)} />
      )}
    </Stack>
  );
};
