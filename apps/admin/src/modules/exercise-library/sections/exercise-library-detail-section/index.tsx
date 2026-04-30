"use client";

import { Chip, Stack, Typography, useTheme } from "@mui/material";

import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard, UserChip } from "@repo/ui";

import { useCoachesList, useExercise } from "@app/lib/hooks";

import { ExerciseLibraryForm } from "../../components";
import { SCOPE_CHIP_COLOR } from "../../constants";

type ExerciseLibraryDetailSectionProps = {
  exercise: ExerciseLibraryItem;
  isPending: boolean;
};

export const ExerciseLibraryDetailSection = ({
  exercise,
  isPending,
}: ExerciseLibraryDetailSectionProps) => {
  const theme = useTheme();
  const { data: coaches } = useCoachesList();
  const { data: parentExercise } = useExercise(exercise.parentId ?? "");
  const ownerCoach = coaches?.find((c) => c.userId === exercise.ownerId);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">{exercise.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={exercise.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[exercise.scope]}
            size="small"
            variant="outlined"
          />
          {exercise.isBenchmark && (
            <Chip label="Benchmark" color="success" size="small" variant="outlined" />
          )}
          {exercise.isDeprecated && (
            <Chip label="Deprecated" color="default" size="small" variant="outlined" />
          )}
        </Stack>
      </Stack>

      <ExerciseLibraryForm isEdit isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={exercise.id} />
          <DetailField label="Owner" labelWidth={theme.spacing(12)}>
            {exercise.ownerId ? (
              <UserChip
                user={
                  ownerCoach
                    ? {
                        id: ownerCoach.userId,
                        name: ownerCoach.name,
                        email: ownerCoach.email,
                      }
                    : { id: exercise.ownerId }
                }
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            )}
          </DetailField>
          <DetailField label="Variant of" labelWidth={theme.spacing(12)}>
            {exercise.parentId ? (
              <Typography variant="body2">{parentExercise?.name ?? exercise.parentId}</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                — (root exercise, not a variant)
              </Typography>
            )}
          </DetailField>
          <DetailField
            label="Version"
            labelWidth={theme.spacing(12)}
            value={String(exercise.version)}
          />
          <DetailField
            label="Created"
            labelWidth={theme.spacing(12)}
            value={formatDate(exercise.createdAt, "long")}
          />
          <DetailField
            label="Updated"
            labelWidth={theme.spacing(12)}
            value={formatDate(exercise.updatedAt, "long")}
          />
        </Stack>
      </FormCard>
    </Stack>
  );
};
