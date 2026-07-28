"use client";

import { type ReactElement } from "react";

import { Alert, Stack, Typography } from "@mui/material";

import { useSession } from "@repo/auth/client";
import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { NotFoundError } from "@repo/errors";
import { LoadingState } from "@repo/ui";

import {
  useAthleteProfile,
  useAthleteProfileAxes,
  useUpdateAthleteProfile,
  useUploadImage,
} from "@app/lib/hooks";

import {
  AthleteDetailsCard,
  BodyHeightCard,
  BodyWeightCard,
  ProfileIdentityCard,
  ProfilePicksSection,
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
import { useProfileLevelSwitch } from "../utils/use-profile-level-switch";

export const AthleteProfileView = (): ReactElement => {
  const { data, isLoading, error } = useAthleteProfile();
  const { data: axes } = useAthleteProfileAxes();
  const { update: updateSession } = useSession();
  const { mutate, isPending } = useUpdateAthleteProfile();
  const upload = useUploadImage();

  const profileAxes = axes ?? [];
  const selections = data?.profileSelections ?? {};
  const gender = data?.gender ?? null;

  const levelSwitch = useProfileLevelSwitch({
    axes: profileAxes,
    selections,
    gender,
    isPending,
    mutate,
  });

  const isMissing = error instanceof NotFoundError;

  if (isLoading) {
    return <LoadingState message={LOADING_LABEL} />;
  }

  if (error && !isMissing) {
    return <Alert severity="error">{ERROR_LABEL}</Alert>;
  }

  const weightKg = data?.weightKg ?? null;
  const heightCm = data?.heightCm ?? null;

  const handleSaveWeight = (kg: number): void => {
    mutate({ weightKg: kg });
  };

  const handleSaveHeight = (cm: number): void => {
    mutate({ heightCm: cm });
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

      <ProfilePicksSection
        axes={profileAxes}
        selections={levelSwitch.displaySelections}
        isSaving={isPending}
        flight={levelSwitch.flight}
        outcome={levelSwitch.outcome}
        onPick={levelSwitch.pick}
        onClearPick={levelSwitch.clearPick}
        onRetry={levelSwitch.retry}
      />

      <AthleteDetailsCard
        gender={gender}
        healthStatus={data?.healthStatus ?? HealthStatus.HEALTHY}
        healthNote={data?.healthNote ?? null}
        isSaving={isPending}
        onChange={mutate}
      />
    </Stack>
  );
};
