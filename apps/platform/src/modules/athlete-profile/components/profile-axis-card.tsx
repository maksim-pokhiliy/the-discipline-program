"use client";

import { type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { CircularProgress, IconButton, List, Stack, Typography } from "@mui/material";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { IndicatorChip } from "@repo/ui";

import {
  ProfileAxisOutcomeStrip,
  ProfileOptionRow,
  shortenCoordinate,
} from "@app/lib/level-switch";

import {
  CAPTION_LINE_HEIGHT,
  CAPTION_PX,
  CARD_PADDING,
  CARD_RADIUS_PX,
  CLEAR_PICK_ARIA_PREFIX,
  CLEAR_PICK_ARIA_SUFFIX,
  FONT_WEIGHT_SEMI_BOLD,
  PICK_CLEAR_ICON_PX,
  PICK_NOT_PICKED_HELPER,
  PICK_NOT_PICKED_LABEL,
  PICK_ROW_TITLE_PX,
} from "../utils/athlete-profile.constants";
import { type LevelSwitchOutcome } from "../utils/use-profile-level-switch";

export type ProfileAxisCardProps = {
  axis: ProfileAxis;
  pickedValue: string | null;
  applyingValue: string | null;
  isClearing: boolean;
  outcome: LevelSwitchOutcome | null;
  isLocked: boolean;
  onPick: (value: string) => void;
  onClear: () => void;
  onRetry: () => void;
};

export const ProfileAxisCard = ({
  axis,
  pickedValue,
  applyingValue,
  isClearing,
  outcome,
  isLocked,
  onPick,
  onClear,
  onRetry,
}: ProfileAxisCardProps): ReactElement => {
  const resolvedValue =
    pickedValue !== null && axis.values.includes(pickedValue) ? pickedValue : null;
  const stateChip =
    resolvedValue === null ? (
      <IndicatorChip tone="warning" label={PICK_NOT_PICKED_LABEL} />
    ) : (
      <IndicatorChip
        tone="success"
        label={shortenCoordinate(resolvedValue)}
        icon={<CheckCircleRounded />}
      />
    );

  return (
    <Stack
      spacing={1.25}
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
            fontSize: theme.typography.pxToRem(PICK_ROW_TITLE_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            color: theme.palette.text.primary,
          })}
        >
          {axis.label}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
          {stateChip}

          {resolvedValue !== null && (
            <IconButton
              aria-label={`${CLEAR_PICK_ARIA_PREFIX}${axis.label}${CLEAR_PICK_ARIA_SUFFIX}`}
              disabled={isLocked}
              onClick={onClear}
              sx={(theme) => ({ color: theme.palette.text.secondary })}
            >
              {isClearing ? (
                <CircularProgress size={PICK_CLEAR_ICON_PX} color="inherit" />
              ) : (
                <CloseRounded sx={{ fontSize: PICK_CLEAR_ICON_PX }} />
              )}
            </IconButton>
          )}
        </Stack>
      </Stack>

      <List
        role="radiogroup"
        aria-label={axis.label}
        disablePadding
        sx={{ display: "flex", flexDirection: "column", gap: 1 }}
      >
        {axis.values.map((value) => (
          <ProfileOptionRow
            key={`${axis.id}:${value}`}
            value={value}
            isCurrent={pickedValue === value}
            isApplying={applyingValue === value}
            isLocked={isLocked}
            onPick={() => onPick(value)}
          />
        ))}
      </List>

      {resolvedValue === null && (
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(CAPTION_PX),
            lineHeight: CAPTION_LINE_HEIGHT,
            color: theme.palette.text.muted,
          })}
        >
          {PICK_NOT_PICKED_HELPER}
        </Typography>
      )}

      <ProfileAxisOutcomeStrip outcome={outcome} isLocked={isLocked} onRetry={onRetry} />
    </Stack>
  );
};
