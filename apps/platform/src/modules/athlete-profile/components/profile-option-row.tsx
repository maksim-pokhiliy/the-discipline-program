"use client";

import { type ReactElement } from "react";

import { CircularProgress, ListItemButton, ListItemText, Radio, Typography } from "@mui/material";

import {
  CARD_RADIUS_PX,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  PICK_APPLYING_LABEL,
  PICK_CURRENT_LABEL,
  PICK_FOCUS_RING_PX,
  PICK_OPTION_LABEL_PX,
  PICK_OPTION_MIN_HEIGHT_PX,
  PICK_SPINNER_PX,
  PICK_TAG_LETTER_SPACING,
  PICK_TAG_PX,
} from "../utils/athlete-profile.constants";

export type ProfileOptionRowProps = {
  value: string;
  isCurrent: boolean;
  isApplying: boolean;
  isLocked: boolean;
  onPick: () => void;
};

export const ProfileOptionRow = ({
  value,
  isCurrent,
  isApplying,
  isLocked,
  onPick,
}: ProfileOptionRowProps): ReactElement => {
  const spinner = isApplying ? <CircularProgress size={PICK_SPINNER_PX} /> : null;
  const tag = isApplying ? PICK_APPLYING_LABEL : isCurrent ? PICK_CURRENT_LABEL : null;

  const handleClick = (): void => {
    if (isLocked || isCurrent) {
      return;
    }

    onPick();
  };

  return (
    <ListItemButton
      component="li"
      role="radio"
      aria-checked={isCurrent}
      selected={isCurrent}
      disabled={isLocked}
      onClick={handleClick}
      sx={(theme) => ({
        alignItems: "flex-start",
        gap: 1.5,
        minHeight: PICK_OPTION_MIN_HEIGHT_PX,
        py: 1.5,
        px: 1.75,
        borderRadius: `${CARD_RADIUS_PX}px`,
        border: `1px solid ${isCurrent ? theme.palette.primary.main : theme.palette.divider}`,
        ...((isCurrent || isApplying) && { "&.Mui-disabled": { opacity: 1 } }),
        "&.Mui-focusVisible": {
          outline: `${PICK_FOCUS_RING_PX}px solid ${theme.palette.primary.main}`,
          outlineOffset: `${PICK_FOCUS_RING_PX}px`,
        },
        ...(isCurrent && { cursor: "default" }),
      })}
    >
      <Radio
        checked={isCurrent}
        readOnly
        disableRipple
        sx={{ p: 0, "& input": { pointerEvents: "none" } }}
        slotProps={{ input: { "aria-hidden": true, tabIndex: -1 } }}
        {...(spinner !== null && { icon: spinner, checkedIcon: spinner })}
      />

      <ListItemText
        primary={value}
        sx={{ my: 0 }}
        slotProps={{
          primary: {
            sx: (theme) => ({
              fontSize: theme.typography.pxToRem(PICK_OPTION_LABEL_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              wordBreak: "break-word",
              ...(isCurrent && { color: theme.palette.primary.main }),
            }),
          },
        }}
      />

      {tag !== null && (
        <Typography
          component="span"
          sx={(theme) => ({
            flexShrink: 0,
            fontSize: theme.typography.pxToRem(PICK_TAG_PX),
            fontWeight: FONT_WEIGHT_DISPLAY,
            letterSpacing: PICK_TAG_LETTER_SPACING,
            textTransform: "uppercase",
            color: isApplying ? theme.palette.text.secondary : theme.palette.primary.main,
          })}
        >
          {tag}
        </Typography>
      )}
    </ListItemButton>
  );
};
