"use client";

import { type ReactElement, useState } from "react";

import EditRounded from "@mui/icons-material/EditRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import { Box, Button, InputAdornment, Stack, TextField, Typography } from "@mui/material";

import { ATHLETE_PROFILE_CONSTANTS } from "@repo/contracts/coaching/athlete-profile";

import {
  ACTION_ICON_PX,
  ACTION_LABEL_PX,
  ACTION_LETTER_SPACING,
  BODY_WEIGHT_CANCEL_LABEL,
  BODY_WEIGHT_CAPTION,
  BODY_WEIGHT_EDIT_ACTION_LABEL,
  BODY_WEIGHT_EMPTY_CAPTION,
  BODY_WEIGHT_EMPTY_ICON_PX,
  BODY_WEIGHT_EMPTY_PX,
  BODY_WEIGHT_EMPTY_TITLE,
  BODY_WEIGHT_EYEBROW,
  BODY_WEIGHT_FIELD_LABEL,
  BODY_WEIGHT_SAVE_LABEL,
  BODY_WEIGHT_SET_ACTION_LABEL,
  BODY_WEIGHT_SET_LABEL,
  BODY_WEIGHT_UNIT_PX,
  BODY_WEIGHT_VALUE_LETTER_SPACING,
  BODY_WEIGHT_VALUE_LINE_HEIGHT,
  BODY_WEIGHT_VALUE_PX,
  CAPTION_LINE_HEIGHT,
  CAPTION_PX,
  CARD_PADDING,
  CARD_RADIUS_PX,
  EYEBROW_LETTER_SPACING,
  EYEBROW_PX,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  KG_LABEL,
  WEIGHT_INPUT_MIN,
  WEIGHT_INPUT_STEP,
  WEIGHT_ROUNDING_FACTOR,
} from "../utils/athlete-profile.constants";

export type BodyWeightCardProps = {
  weightKg: number | null;
  isSaving: boolean;
  onSave: (kg: number) => void;
};

const parseDraft = (draft: string): number | null => {
  const parsed = Number.parseFloat(draft);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  const clamped = Math.min(parsed, ATHLETE_PROFILE_CONSTANTS.MAX_WEIGHT_KG);

  return Math.round(clamped * WEIGHT_ROUNDING_FACTOR) / WEIGHT_ROUNDING_FACTOR;
};

export const BodyWeightCard = ({
  weightKg,
  isSaving,
  onSave,
}: BodyWeightCardProps): ReactElement => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = (): void => {
    setDraft(weightKg != null ? String(weightKg) : "");
    setIsEditing(true);
  };

  const cancelEditing = (): void => {
    setIsEditing(false);
    setDraft("");
  };

  const handleSave = (): void => {
    const value = parseDraft(draft);

    if (value == null) {
      return;
    }

    onSave(value);
    setIsEditing(false);
  };

  const isDraftValid = parseDraft(draft) != null;
  const actionLabel =
    weightKg != null ? BODY_WEIGHT_EDIT_ACTION_LABEL : BODY_WEIGHT_SET_ACTION_LABEL;

  return (
    <Stack
      spacing={1.5}
      sx={(theme) => ({
        flex: { md: 1 },
        p: CARD_PADDING,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${CARD_RADIUS_PX}px`,
      })}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
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
          {BODY_WEIGHT_EYEBROW}
        </Typography>

        {!isEditing && (
          <Button
            size="small"
            color="primary"
            startIcon={<EditRounded sx={{ fontSize: ACTION_ICON_PX }} />}
            onClick={startEditing}
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(ACTION_LABEL_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              letterSpacing: ACTION_LETTER_SPACING,
              textTransform: "uppercase",
            })}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>

      {isEditing ? (
        <Stack spacing={1}>
          <TextField
            label={BODY_WEIGHT_FIELD_LABEL}
            type="number"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            inputProps={{ inputMode: "decimal", step: WEIGHT_INPUT_STEP, min: WEIGHT_INPUT_MIN }}
            InputProps={{
              endAdornment: <InputAdornment position="end">{KG_LABEL}</InputAdornment>,
            }}
          />

          <Button
            variant="contained"
            color="primary"
            disabled={!isDraftValid || isSaving}
            onClick={handleSave}
          >
            {BODY_WEIGHT_SAVE_LABEL}
          </Button>

          <Button color="inherit" onClick={cancelEditing} sx={{ color: "text.secondary" }}>
            {BODY_WEIGHT_CANCEL_LABEL}
          </Button>
        </Stack>
      ) : weightKg != null ? (
        <Stack spacing={1}>
          <Stack direction="row" alignItems="baseline" spacing={0.75}>
            <Box
              component="div"
              sx={(theme) => ({
                fontFamily: theme.typography.h4.fontFamily,
                fontWeight: FONT_WEIGHT_DISPLAY,
                fontSize: theme.typography.pxToRem(BODY_WEIGHT_VALUE_PX),
                lineHeight: BODY_WEIGHT_VALUE_LINE_HEIGHT,
                letterSpacing: BODY_WEIGHT_VALUE_LETTER_SPACING,
                color: theme.palette.text.primary,
              })}
            >
              {weightKg}
            </Box>

            <Typography
              component="span"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(BODY_WEIGHT_UNIT_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                textTransform: "uppercase",
                color: theme.palette.text.muted,
              })}
            >
              {KG_LABEL}
            </Typography>
          </Stack>

          <Typography
            component="div"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(CAPTION_PX),
              lineHeight: CAPTION_LINE_HEIGHT,
              color: theme.palette.text.muted,
            })}
          >
            {BODY_WEIGHT_CAPTION}
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ErrorOutlineRounded
              sx={(theme) => ({
                fontSize: BODY_WEIGHT_EMPTY_ICON_PX,
                color: theme.palette.warning.main,
              })}
            />

            <Typography
              component="div"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(BODY_WEIGHT_EMPTY_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                color: theme.palette.text.secondary,
              })}
            >
              {BODY_WEIGHT_EMPTY_TITLE}
            </Typography>
          </Stack>

          <Typography
            component="div"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(CAPTION_PX),
              lineHeight: CAPTION_LINE_HEIGHT,
              color: theme.palette.text.muted,
            })}
          >
            {BODY_WEIGHT_EMPTY_CAPTION}
          </Typography>

          <Box>
            <Button variant="contained" color="primary" onClick={startEditing}>
              {BODY_WEIGHT_SET_LABEL}
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  );
};
