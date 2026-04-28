"use client";

import { Checkbox, Stack, Typography } from "@mui/material";

import { type PlanStructureSetGroup } from "@repo/contracts/lms/training-plan";

type SetGroupPreviewProps = {
  setGroup: PlanStructureSetGroup;
};

export const SetGroupPreview = ({ setGroup }: SetGroupPreviewProps) => (
  <Stack spacing={0.5} sx={{ pl: 1 }}>
    {setGroup.label ? (
      <Typography variant="caption" color="text.secondary">
        {setGroup.label}
      </Typography>
    ) : null}

    {setGroup.entries.map((entry) => (
      <Stack key={entry.id} direction="row" alignItems="center" spacing={1}>
        <Checkbox size="small" disabled />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="body2">{entry.exerciseSnapshot.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {entry.prescription.reps?.kind === "FIXED"
              ? `${entry.prescription.reps.value.toString()} reps`
              : entry.prescription.reps?.kind === "RANGE"
                ? `${entry.prescription.reps.min.toString()}-${entry.prescription.reps.max.toString()} reps`
                : entry.prescription.durationSec
                  ? `${entry.prescription.durationSec.toString()}s`
                  : entry.prescription.distanceM
                    ? `${entry.prescription.distanceM.toString()}m`
                    : entry.prescription.calories
                      ? `${entry.prescription.calories.toString()} cal`
                      : "—"}
          </Typography>
        </Stack>
      </Stack>
    ))}
  </Stack>
);
