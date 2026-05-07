"use client";

import { Stack, Typography } from "@mui/material";

import { type PlanItem } from "@repo/contracts/lms/plan-item";

import { PrescriptionSummary } from "./prescription-summary";
import { type Lookups } from "./types";

const DELETED_EXERCISE_LABEL = "(deleted exercise)";

type PlanItemRowProps = { item: PlanItem; lookups: Lookups };

export const PlanItemRow: React.FC<PlanItemRowProps> = ({ item, lookups }) => {
  const exercise = lookups.exercises.get(item.exerciseId);
  const exerciseLabel = exercise !== undefined ? exercise.name : DELETED_EXERCISE_LABEL;
  const isDeleted = exercise === undefined;

  return (
    <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
      <Typography variant="body2" color={isDeleted ? "text.secondary" : "text.primary"}>
        {exerciseLabel}
      </Typography>
      <PrescriptionSummary prescription={item.prescription} />
      {item.notes !== null ? (
        <Typography variant="caption" color="text.secondary">
          {item.notes}
        </Typography>
      ) : null}
    </Stack>
  );
};
