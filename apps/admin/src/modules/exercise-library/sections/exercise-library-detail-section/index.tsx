"use client";

import { useState } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { Button, Chip, Stack, Typography, useTheme } from "@mui/material";

import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard } from "@repo/ui";

import { ExerciseLibraryForm } from "../../components";
import { SCOPE_CHIP_COLOR } from "../../constants";
import { PromoteDemoteSection } from "../promote-demote-section";

type ExerciseLibraryDetailSectionProps = {
  exercise: ExerciseLibraryItem;
  isPending: boolean;
};

export const ExerciseLibraryDetailSection = ({
  exercise,
  isPending,
}: ExerciseLibraryDetailSectionProps) => {
  const theme = useTheme();
  const [promoteTarget, setPromoteTarget] = useState<{ exercise: ExerciseLibraryItem } | null>(
    null,
  );
  const [demoteTarget, setDemoteTarget] = useState<{ exercise: ExerciseLibraryItem } | null>(null);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
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

        {exercise.scope === "COACH" ? (
          <Button
            type="button"
            variant="outlined"
            color="primary"
            startIcon={<ArrowUpwardIcon />}
            onClick={() => setPromoteTarget({ exercise })}
            disabled={isPending}
          >
            Promote to SYSTEM
          </Button>
        ) : (
          <Button
            type="button"
            variant="outlined"
            color="warning"
            startIcon={<ArrowDownwardIcon />}
            onClick={() => setDemoteTarget({ exercise })}
            disabled={isPending}
          >
            Demote to COACH
          </Button>
        )}
      </Stack>

      <ExerciseLibraryForm isEdit isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={exercise.id} />
          <DetailField
            label="Owner"
            labelWidth={theme.spacing(12)}
            value={exercise.ownerId ?? "—"}
          />
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

      <PromoteDemoteSection
        promoteTarget={promoteTarget}
        demoteTarget={demoteTarget}
        onClose={() => {
          setPromoteTarget(null);
          setDemoteTarget(null);
        }}
      />
    </Stack>
  );
};
