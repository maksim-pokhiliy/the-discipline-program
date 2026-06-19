"use client";

import { type ReactElement } from "react";

import { Alert, Stack, Typography } from "@mui/material";

import { useSession } from "@repo/auth/client";
import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { NotFoundError } from "@repo/errors";
import { LoadingState } from "@repo/ui";

import { useAthleteProfile, useUpdateAthleteProfile, useUploadImage } from "@app/lib/hooks";

import {
  AthleteDetailsCard,
  BodyHeightCard,
  BodyWeightCard,
  ProfileIdentityCard,
  ProfilePicksCard,
} from "../components";
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
  const { update: updateSession } = useSession();
  const { mutate, isPending } = useUpdateAthleteProfile();
  const upload = useUploadImage();

  const isMissing = error instanceof NotFoundError;

  if (isLoading) {
    return <LoadingState message={LOADING_LABEL} />;
  }

  if (error && !isMissing) {
    return <Alert severity="error">{ERROR_LABEL}</Alert>;
  }

  const weightKg = data?.weightKg ?? null;
  const heightCm = data?.heightCm ?? null;
  const selections = data?.profileSelections ?? {};

  const handleSaveWeight = (kg: number): void => {
    mutate({ weightKg: kg });
  };

  const handleSaveHeight = (cm: number): void => {
    mutate({ heightCm: cm });
  };

  const handleClearPick = (axis: string): void => {
    const next = Object.fromEntries(Object.entries(selections).filter(([key]) => key !== axis));

    mutate({ profileSelections: next });
  };

  const onSelectAvatarFile = (file: File): void => {
    upload.mutate(
      { file, context: "avatar" },
      {
        onSuccess: ({ url }) => {
          mutate({ image: url });
          void updateSession({ image: url });
        },
      },
    );
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

      <ProfileIdentityCard
        image={data?.image ?? null}
        isUploadingAvatar={upload.isPending}
        onSelectAvatarFile={onSelectAvatarFile}
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={SECTION_GAP} alignItems="stretch">
        <BodyWeightCard weightKg={weightKg} isSaving={isPending} onSave={handleSaveWeight} />
        <BodyHeightCard heightCm={heightCm} isSaving={isPending} onSave={handleSaveHeight} />
      </Stack>

      <ProfilePicksCard
        selections={selections}
        isSaving={isPending}
        onClearPick={handleClearPick}
      />

      <AthleteDetailsCard
        gender={data?.gender ?? null}
        healthStatus={data?.healthStatus ?? HealthStatus.HEALTHY}
        healthNote={data?.healthNote ?? null}
        isSaving={isPending}
        onChange={mutate}
      />
    </Stack>
  );
};
