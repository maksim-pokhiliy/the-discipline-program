import { type ReactElement } from "react";

import { Stack, Typography } from "@mui/material";

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
  PROFILE_PICKS_EMPTY,
  PROFILE_PICKS_EYEBROW,
} from "../utils/athlete-profile.constants";

import { ProfilePickRow } from "./profile-pick-row";

export type ProfilePicksCardProps = {
  selections: Record<string, string>;
  isSaving: boolean;
  onClearPick: (axis: string) => void;
};

const formatCount = (count: number): string => {
  const noun = count === 1 ? PROFILE_PICKS_COUNT_SINGULAR : PROFILE_PICKS_COUNT_PLURAL;

  return `${count}${PROFILE_PICKS_COUNT_SEPARATOR}${noun}`;
};

export const ProfilePicksCard = ({
  selections,
  isSaving,
  onClearPick,
}: ProfilePicksCardProps): ReactElement => {
  const entries = Object.entries(selections);

  return (
    <Stack
      spacing={1.5}
      sx={(theme) => ({
        flex: "2 1 380px",
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

        {entries.length > 0 && (
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(CAPTION_PX),
              color: theme.palette.text.muted,
            })}
          >
            {formatCount(entries.length)}
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

      {entries.length > 0 ? (
        <Stack spacing={1.5}>
          {entries.map(([axis, value]) => (
            <ProfilePickRow
              key={axis}
              axis={axis}
              value={value}
              isSaving={isSaving}
              onClear={() => onClearPick(axis)}
            />
          ))}
        </Stack>
      ) : (
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(CAPTION_PX),
            lineHeight: CAPTION_LINE_HEIGHT,
            color: theme.palette.text.muted,
          })}
        >
          {PROFILE_PICKS_EMPTY}
        </Typography>
      )}
    </Stack>
  );
};
