import { type ReactElement } from "react";

import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import MilitaryTechRounded from "@mui/icons-material/MilitaryTechRounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type Result } from "@repo/contracts/lms/_shared";

import {
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  STATUS_STRIP_BG_ALPHA,
  STATUS_STRIP_BORDER_ALPHA,
  STATUS_STRIP_ICON_PX,
  STATUS_STRIP_LOGGED_SUFFIX,
  STATUS_STRIP_NOT_LOGGED_LINE_HEIGHT,
  STATUS_STRIP_NOT_LOGGED_PX,
  STATUS_STRIP_NOT_LOGGED_SENTENCE,
  STATUS_STRIP_PADDING_X_PX,
  STATUS_STRIP_PADDING_Y_PX,
  STATUS_STRIP_RADIUS_PX,
  STATUS_STRIP_TITLE_PX,
  STATUS_STRIP_VALUE_PX,
} from "../utils/athlete-session.constants";
import { formatResult } from "../utils/format-result";

export type BenchmarkStatusStripProps = {
  title: string;
  result: Result | null;
};

export const BenchmarkStatusStrip = ({
  title,
  result,
}: BenchmarkStatusStripProps): ReactElement => {
  if (result === null) {
    return (
      <Stack
        direction="row"
        spacing={1.25}
        sx={(theme) => ({
          px: `${STATUS_STRIP_PADDING_X_PX}px`,
          py: `${STATUS_STRIP_PADDING_Y_PX}px`,
          borderRadius: `${STATUS_STRIP_RADIUS_PX}px`,
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <MilitaryTechRounded
          sx={(theme) => ({ fontSize: STATUS_STRIP_ICON_PX, color: theme.palette.text.muted })}
        />
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(STATUS_STRIP_NOT_LOGGED_PX),
            lineHeight: STATUS_STRIP_NOT_LOGGED_LINE_HEIGHT,
            color: theme.palette.text.secondary,
          })}
        >
          {`${title}${STATUS_STRIP_NOT_LOGGED_SENTENCE}`}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={(theme) => ({
        px: `${STATUS_STRIP_PADDING_X_PX}px`,
        py: `${STATUS_STRIP_PADDING_Y_PX}px`,
        borderRadius: `${STATUS_STRIP_RADIUS_PX}px`,
        bgcolor: alpha(theme.palette.success.main, STATUS_STRIP_BG_ALPHA),
        border: `1px solid ${alpha(theme.palette.success.main, STATUS_STRIP_BORDER_ALPHA)}`,
      })}
    >
      <EmojiEventsRounded
        sx={(theme) => ({ fontSize: STATUS_STRIP_ICON_PX, color: theme.palette.success.main })}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(STATUS_STRIP_TITLE_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            color: theme.palette.text.primary,
          })}
        >
          {`${title}${STATUS_STRIP_LOGGED_SUFFIX}`}
        </Typography>
        <Box
          component="div"
          sx={(theme) => ({
            fontFamily: theme.typography.h4.fontFamily,
            fontWeight: FONT_WEIGHT_DISPLAY,
            fontSize: theme.typography.pxToRem(STATUS_STRIP_VALUE_PX),
            lineHeight: 1.1,
            color: theme.palette.success.main,
          })}
        >
          {formatResult(result)}
        </Box>
      </Box>
    </Stack>
  );
};
