"use client";

import { type ReactElement } from "react";

import { Stack, Typography } from "@mui/material";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { LoadingState } from "@repo/ui";

import {
  CAPTION_LINE_HEIGHT,
  CAPTION_PX,
  CARD_GAP,
  EYEBROW_LETTER_SPACING,
  EYEBROW_PX,
  FONT_WEIGHT_SEMI_BOLD,
  PICKS_LOADING_MIN_HEIGHT,
  PROFILE_PICKS_CAPTION,
  PROFILE_PICKS_EYEBROW,
  PROFILE_PICKS_NO_AXES,
} from "../utils/athlete-profile.constants";
import {
  type LevelSwitchFlight,
  type LevelSwitchOutcomes,
} from "../utils/use-profile-level-switch";

import { ProfileAxisCard } from "./profile-axis-card";

export type ProfilePicksSectionProps = {
  axes: ProfileAxis[] | undefined;
  selections: Record<string, string>;
  isSaving: boolean;
  flight: LevelSwitchFlight | null;
  outcomes: LevelSwitchOutcomes;
  onPick: (axisId: string, value: string) => void;
  onClearPick: (axisId: string) => void;
  onRetry: (axisId: string) => void;
};

export const ProfilePicksSection = ({
  axes,
  selections,
  isSaving,
  flight,
  outcomes,
  onPick,
  onClearPick,
  onRetry,
}: ProfilePicksSectionProps): ReactElement => {
  const pickableAxes = (axes ?? []).filter((axis) => axis.binding === null);
  const isLocked = isSaving || flight !== null;

  return (
    <Stack spacing={CARD_GAP}>
      <Stack spacing={0.75}>
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(EYEBROW_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            letterSpacing: EYEBROW_LETTER_SPACING,
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
          })}
        >
          {PROFILE_PICKS_EYEBROW}
        </Typography>

        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(CAPTION_PX),
            lineHeight: CAPTION_LINE_HEIGHT,
            color: theme.palette.text.muted,
          })}
        >
          {PROFILE_PICKS_CAPTION}
        </Typography>
      </Stack>

      {axes === undefined && <LoadingState minHeight={PICKS_LOADING_MIN_HEIGHT} />}

      {axes !== undefined && pickableAxes.length > 0 && (
        <Stack spacing={CARD_GAP}>
          {pickableAxes.map((axis) => (
            <ProfileAxisCard
              key={axis.id}
              axis={axis}
              pickedValue={selections[axis.id] ?? null}
              applyingValue={flight !== null && flight.axisId === axis.id ? flight.value : null}
              isClearing={flight !== null && flight.axisId === axis.id && flight.value === null}
              outcome={outcomes[axis.id] ?? null}
              isLocked={isLocked}
              onPick={(value) => onPick(axis.id, value)}
              onClear={() => onClearPick(axis.id)}
              onRetry={() => onRetry(axis.id)}
            />
          ))}
        </Stack>
      )}

      {axes !== undefined && pickableAxes.length === 0 && (
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(CAPTION_PX),
            lineHeight: CAPTION_LINE_HEIGHT,
            color: theme.palette.text.muted,
          })}
        >
          {PROFILE_PICKS_NO_AXES}
        </Typography>
      )}
    </Stack>
  );
};
