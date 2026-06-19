"use client";

import { type ReactElement } from "react";

import { Alert, Stack, Typography } from "@mui/material";

import { NotFoundError } from "@repo/errors";
import { LoadingState } from "@repo/ui";

import { useAthleteProfile, useUpdateAthleteProfile } from "@app/lib/hooks";

import { BodyWeightCard, ProfileIdentityCard, ProfilePicksCard } from "../components";
import {
  CONTENT_GAP,
  ERROR_LABEL,
  FONT_WEIGHT_MEDIUM,
  LOADING_LABEL,
  SECTION_GAP,
  TITLE_LABEL,
  TITLE_PX,
} from "../utils/athlete-profile.constants";

export const AthleteProfileView = (): ReactElement => {
  const { data, isLoading, error } = useAthleteProfile();
  const { mutate, isPending } = useUpdateAthleteProfile();

  const isMissing = error instanceof NotFoundError;

  if (isLoading) {
    return <LoadingState message={LOADING_LABEL} />;
  }

  if (error && !isMissing) {
    return <Alert severity="error">{ERROR_LABEL}</Alert>;
  }

  const weightKg = data?.weightKg ?? null;
  const selections = data?.profileSelections ?? {};

  const handleSaveWeight = (kg: number): void => {
    mutate({ weightKg: kg });
  };

  const handleClearPick = (axis: string): void => {
    const next = Object.fromEntries(Object.entries(selections).filter(([key]) => key !== axis));

    mutate({ profileSelections: next });
  };

  return (
    <Stack spacing={CONTENT_GAP}>
      <Typography
        component="div"
        sx={(theme) => ({
          fontFamily: theme.typography.body1.fontFamily,
          fontSize: theme.typography.pxToRem(TITLE_PX),
          fontWeight: FONT_WEIGHT_MEDIUM,
          color: theme.palette.text.primary,
        })}
      >
        {TITLE_LABEL}
      </Typography>

      <ProfileIdentityCard />

      <Stack direction={{ xs: "column", md: "row" }} spacing={SECTION_GAP} flexWrap="wrap">
        <BodyWeightCard weightKg={weightKg} isSaving={isPending} onSave={handleSaveWeight} />
        <ProfilePicksCard
          selections={selections}
          isSaving={isPending}
          onClearPick={handleClearPick}
        />
      </Stack>
    </Stack>
  );
};
