"use client";

import { type ReactElement } from "react";

import CloseRounded from "@mui/icons-material/CloseRounded";
import { Box, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";

import { BaseModal } from "@repo/ui";

import { UpdateOneRmForm, type OneRmMovementOption } from "./update-one-rm-form";

const MODAL_TITLE = "Update 1RM";
const MODAL_SUBTITLE = "Log a tested or manually estimated max. Coach can see every entry.";
const CLOSE_LABEL = "Close";
const DIALOG_MAX_WIDTH = "xs";

const SHEET_RADIUS_PX = 12;
const SHEET_MAX_HEIGHT = "88%";
const SHEET_PADDING_TOP = 2;
const SHEET_PADDING_X = 2.5;
const SHEET_HEADER_GAP = 2;
const SHEET_TITLE_PX = 18;
const SHEET_TITLE_WEIGHT = 600;
const SHEET_SAFE_AREA_PAD = "calc(env(safe-area-inset-bottom) + 24px)";

export type UpdateOneRmModalProps = {
  open: boolean;
  onClose: () => void;
  presetExerciseId?: string | undefined;
  movements: OneRmMovementOption[];
};

export const UpdateOneRmModal = ({
  open,
  onClose,
  presetExerciseId,
  movements,
}: UpdateOneRmModalProps): ReactElement => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  if (isDesktop) {
    return (
      <BaseModal
        open={open}
        onClose={onClose}
        title={MODAL_TITLE}
        subtitle={MODAL_SUBTITLE}
        maxWidth={DIALOG_MAX_WIDTH}
      >
        <UpdateOneRmForm
          presetExerciseId={presetExerciseId}
          movements={movements}
          onClose={onClose}
        />
      </BaseModal>
    );
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: (sheetTheme) => ({
            bgcolor: sheetTheme.palette.background.paper,
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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={SHEET_HEADER_GAP}
        sx={{ mb: SHEET_HEADER_GAP }}
      >
        <Box>
          <Typography
            component="div"
            sx={(headerTheme) => ({
              fontSize: headerTheme.typography.pxToRem(SHEET_TITLE_PX),
              fontWeight: SHEET_TITLE_WEIGHT,
              color: headerTheme.palette.text.primary,
            })}
          >
            {MODAL_TITLE}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {MODAL_SUBTITLE}
          </Typography>
        </Box>

        <IconButton aria-label={CLOSE_LABEL} onClick={onClose}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Stack>

      <UpdateOneRmForm
        presetExerciseId={presetExerciseId}
        movements={movements}
        onClose={onClose}
      />
    </Drawer>
  );
};
