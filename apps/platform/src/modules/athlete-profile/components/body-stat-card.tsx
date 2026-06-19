"use client";

import { type ReactElement, useState } from "react";

import EditRounded from "@mui/icons-material/EditRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import { Box, Button, InputAdornment, Stack, TextField, Typography } from "@mui/material";

import {
  ACTION_ICON_PX,
  ACTION_LABEL_PX,
  ACTION_LETTER_SPACING,
  BODY_STAT_CANCEL_LABEL,
  BODY_STAT_EMPTY_ICON_PX,
  BODY_STAT_EMPTY_PX,
  BODY_STAT_SAVE_LABEL,
  BODY_STAT_UNIT_PX,
  BODY_STAT_VALUE_LETTER_SPACING,
  BODY_STAT_VALUE_LINE_HEIGHT,
  BODY_STAT_VALUE_PX,
  CAPTION_LINE_HEIGHT,
  CAPTION_PX,
  CARD_PADDING,
  CARD_RADIUS_PX,
  EYEBROW_LETTER_SPACING,
  EYEBROW_PX,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
} from "../utils/athlete-profile.constants";

export type BodyStatCardProps = {
  value: number | null;
  isSaving: boolean;
  onSave: (value: number) => void;
  parseValue: (draft: string) => number | null;
  eyebrow: string;
  unit: string;
  caption: string;
  emptyTitle: string;
  emptyCaption: string;
  setLabel: string;
  editActionLabel: string;
  setActionLabel: string;
  fieldLabel: string;
  inputStep: number;
  inputMin: number;
  inputMax: number;
};

export const BodyStatCard = ({
  value,
  isSaving,
  onSave,
  parseValue,
  eyebrow,
  unit,
  caption,
  emptyTitle,
  emptyCaption,
  setLabel,
  editActionLabel,
  setActionLabel,
  fieldLabel,
  inputStep,
  inputMin,
  inputMax,
}: BodyStatCardProps): ReactElement => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = (): void => {
    setDraft(value != null ? String(value) : "");
    setIsEditing(true);
  };

  const cancelEditing = (): void => {
    setIsEditing(false);
    setDraft("");
  };

  const handleSave = (): void => {
    const parsed = parseValue(draft);

    if (parsed == null) {
      return;
    }

    onSave(parsed);
    setIsEditing(false);
  };

  const isDraftValid = parseValue(draft) != null;
  const actionLabel = value != null ? editActionLabel : setActionLabel;

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
          {eyebrow}
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
            label={fieldLabel}
            type="number"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            inputProps={{ inputMode: "decimal", step: inputStep, min: inputMin, max: inputMax }}
            InputProps={{
              endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
            }}
          />

          <Button
            variant="contained"
            color="primary"
            disabled={!isDraftValid || isSaving}
            onClick={handleSave}
          >
            {BODY_STAT_SAVE_LABEL}
          </Button>

          <Button color="inherit" onClick={cancelEditing} sx={{ color: "text.secondary" }}>
            {BODY_STAT_CANCEL_LABEL}
          </Button>
        </Stack>
      ) : value != null ? (
        <Stack spacing={1}>
          <Stack direction="row" alignItems="baseline" spacing={0.75}>
            <Box
              component="div"
              sx={(theme) => ({
                fontFamily: theme.typography.h4.fontFamily,
                fontWeight: FONT_WEIGHT_DISPLAY,
                fontSize: theme.typography.pxToRem(BODY_STAT_VALUE_PX),
                lineHeight: BODY_STAT_VALUE_LINE_HEIGHT,
                letterSpacing: BODY_STAT_VALUE_LETTER_SPACING,
                color: theme.palette.text.primary,
              })}
            >
              {String(value)}
            </Box>

            <Typography
              component="span"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(BODY_STAT_UNIT_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                textTransform: "uppercase",
                color: theme.palette.text.muted,
              })}
            >
              {unit}
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
            {caption}
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ErrorOutlineRounded
              sx={(theme) => ({
                fontSize: BODY_STAT_EMPTY_ICON_PX,
                color: theme.palette.warning.main,
              })}
            />

            <Typography
              component="div"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(BODY_STAT_EMPTY_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                color: theme.palette.text.secondary,
              })}
            >
              {emptyTitle}
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
            {emptyCaption}
          </Typography>

          <Box>
            <Button variant="contained" color="primary" onClick={startEditing}>
              {setLabel}
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  );
};
