"use client";

import { type ReactElement, useId } from "react";

import { alpha, Box, Drawer, Typography, useMediaQuery, useTheme } from "@mui/material";

import { BaseModal } from "@repo/ui";

import {
  FONT_WEIGHT_SEMI_BOLD,
  SHEET_HANDLE_ALPHA,
  SHEET_HANDLE_HEIGHT_PX,
  SHEET_HANDLE_WIDTH_PX,
  SHEET_MAX_HEIGHT,
  SHEET_RADIUS_PX,
  SHEET_TITLE_ALPHA,
  SHEET_TITLE_PX,
} from "../utils/athlete-session.constants";
import { type WeightSheetControls, type WeightSheetState } from "../utils/use-weight-sheet";
import {
  LEVEL_SHEET_TITLE,
  MAX_SHEET_TITLE_PREFIX,
  MAX_SHEET_TITLE_SUFFIX,
  SHEET_DIALOG_MAX_WIDTH,
  SHEET_HANDLE_MARGIN_BOTTOM,
  SHEET_PADDING_TOP,
  SHEET_PADDING_X,
  SHEET_SAFE_AREA_PAD,
} from "../utils/weight-sheet.constants";

import { LevelSheetBody } from "./level-sheet-body";
import { MaxSheetBody } from "./max-sheet-body";

export type WeightSourceSheetProps = WeightSheetControls;

const titleOf = (sheet: WeightSheetState): string =>
  sheet.kind === "level"
    ? LEVEL_SHEET_TITLE
    : `${MAX_SHEET_TITLE_PREFIX}${sheet.row.movement}${MAX_SHEET_TITLE_SUFFIX}`;

export const WeightSourceSheet = ({
  sheet,
  levelAxes,
  levelCoordinates,
  levelSavedCoordinates,
  levelWeightCount,
  isLevelDraftComplete,
  isApplyingLevel,
  isOtherApplyPending,
  levelOutcome,
  maxValue,
  isSavingMax,
  canSaveMax,
  closeSheet,
  pickLevelCoordinate,
  applyLevel,
  setMaxValue,
  saveMax,
}: WeightSourceSheetProps): ReactElement | null => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const titleId = useId();

  if (sheet === null) {
    return null;
  }

  const title = titleOf(sheet);
  const body =
    sheet.kind === "level" ? (
      <LevelSheetBody
        row={sheet.row}
        axes={levelAxes}
        coordinates={levelCoordinates}
        savedCoordinates={levelSavedCoordinates}
        weightCount={levelWeightCount}
        isComplete={isLevelDraftComplete}
        isApplying={isApplyingLevel}
        isBlocked={isOtherApplyPending}
        outcome={levelOutcome}
        onPick={pickLevelCoordinate}
        onApply={applyLevel}
        onCancel={closeSheet}
      />
    ) : (
      <MaxSheetBody
        row={sheet.row}
        value={maxValue}
        isSaving={isSavingMax}
        canSave={canSaveMax}
        onChange={setMaxValue}
        onSave={saveMax}
        onCancel={closeSheet}
      />
    );

  if (isDesktop) {
    return (
      <BaseModal open onClose={closeSheet} title={title} maxWidth={SHEET_DIALOG_MAX_WIDTH}>
        {body}
      </BaseModal>
    );
  }

  return (
    <Drawer
      anchor="bottom"
      open
      onClose={closeSheet}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": titleId,
          sx: (sheetTheme) => ({
            bgcolor: sheetTheme.palette.background.paper,
            borderRight: "none",
            borderTopLeftRadius: SHEET_RADIUS_PX,
            borderTopRightRadius: SHEET_RADIUS_PX,
            maxHeight: SHEET_MAX_HEIGHT,
            pt: SHEET_PADDING_TOP,
            px: SHEET_PADDING_X,
            pb: SHEET_SAFE_AREA_PAD,
          }),
        },
      }}
    >
      <Box
        sx={(handleTheme) => ({
          width: SHEET_HANDLE_WIDTH_PX,
          height: SHEET_HANDLE_HEIGHT_PX,
          mx: "auto",
          mb: SHEET_HANDLE_MARGIN_BOTTOM,
          borderRadius: `${SHEET_HANDLE_HEIGHT_PX}px`,
          bgcolor: alpha(handleTheme.palette.common.white, SHEET_HANDLE_ALPHA),
        })}
      />

      <Typography
        id={titleId}
        component="div"
        sx={(titleTheme) => ({
          mb: SHEET_HANDLE_MARGIN_BOTTOM,
          fontSize: titleTheme.typography.pxToRem(SHEET_TITLE_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          color: alpha(titleTheme.palette.common.white, SHEET_TITLE_ALPHA),
        })}
      >
        {title}
      </Typography>

      {body}
    </Drawer>
  );
};
