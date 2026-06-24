import { type ReactElement } from "react";

import { Grid, Stack, Typography } from "@mui/material";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import {
  CAPTION_LINE_HEIGHT,
  CAPTION_PX,
  CARD_PADDING,
  CARD_RADIUS_PX,
  EYEBROW_LETTER_SPACING,
  EYEBROW_PX,
  FONT_WEIGHT_SEMI_BOLD,
  PROFILE_PICKS_CAPTION,
  PROFILE_PICKS_COUNT_PLURAL,
  PROFILE_PICKS_COUNT_SEPARATOR,
  PROFILE_PICKS_COUNT_SINGULAR,
  PROFILE_PICKS_EYEBROW,
  PROFILE_PICKS_NO_AXES,
} from "../utils/athlete-profile.constants";

import { ProfilePickGroup } from "./profile-pick-group";

export type ProfilePicksCardProps = {
  axes: ProfileAxis[];
  selections: Record<string, string>;
  isSaving: boolean;
  onPick: (axisId: string, value: string) => void;
  onClearPick: (axis: string) => void;
};

const formatCount = (count: number): string => {
  const noun = count === 1 ? PROFILE_PICKS_COUNT_SINGULAR : PROFILE_PICKS_COUNT_PLURAL;

  return `${count}${PROFILE_PICKS_COUNT_SEPARATOR}${noun}`;
};

export const ProfilePicksCard = ({
  axes,
  selections,
  isSaving,
  onPick,
  onClearPick,
}: ProfilePicksCardProps): ReactElement => {
  const pickableAxes = axes.filter((axis) => axis.binding === null);
  const pickedCount = pickableAxes.filter((axis) => selections[axis.id] !== undefined).length;

  return (
    <Stack
      spacing={1.5}
      sx={(theme) => ({
        p: CARD_PADDING,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${CARD_RADIUS_PX}px`,
      })}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
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

        {pickedCount > 0 && (
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(CAPTION_PX),
              color: theme.palette.text.muted,
            })}
          >
            {formatCount(pickedCount)}
          </Typography>
        )}
      </Stack>

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

      {pickableAxes.length > 0 ? (
        <Grid container spacing={1.5}>
          {pickableAxes.map((axis) => (
            <Grid key={axis.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ProfilePickGroup
                axis={axis}
                activeValue={selections[axis.id]}
                isSaving={isSaving}
                onPick={(value) => onPick(axis.id, value)}
                onClear={() => onClearPick(axis.id)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
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
