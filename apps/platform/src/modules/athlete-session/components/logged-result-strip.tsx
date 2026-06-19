import { type ReactElement } from "react";

import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type Result, formatResult } from "@repo/contracts/lms/_shared";

import {
  FONT_WEIGHT_DISPLAY,
  RESULT_STRIP_BG_ALPHA,
  RESULT_STRIP_BORDER_ALPHA,
  RESULT_STRIP_HEADING_LABEL,
  RESULT_STRIP_ICON_PX,
  RESULT_STRIP_LABEL_ALPHA,
  RESULT_STRIP_LABEL_LETTER_SPACING,
  RESULT_STRIP_LABEL_PX,
  RESULT_STRIP_PADDING_X_PX,
  RESULT_STRIP_PADDING_Y_PX,
  RESULT_STRIP_VALUE_PX,
} from "../utils/athlete-session.constants";

export type LoggedResultStripProps = {
  result: Result;
};

export const LoggedResultStrip = ({ result }: LoggedResultStripProps): ReactElement => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.25}
    sx={(theme) => ({
      px: `${RESULT_STRIP_PADDING_X_PX}px`,
      py: `${RESULT_STRIP_PADDING_Y_PX}px`,
      bgcolor: alpha(theme.palette.success.main, RESULT_STRIP_BG_ALPHA),
      borderBottom: `1px solid ${alpha(theme.palette.success.main, RESULT_STRIP_BORDER_ALPHA)}`,
    })}
  >
    <EmojiEventsRounded
      sx={(theme) => ({ fontSize: RESULT_STRIP_ICON_PX, color: theme.palette.success.main })}
    />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(RESULT_STRIP_LABEL_PX),
          fontWeight: FONT_WEIGHT_DISPLAY,
          letterSpacing: RESULT_STRIP_LABEL_LETTER_SPACING,
          textTransform: "uppercase",
          color: alpha(theme.palette.success.main, RESULT_STRIP_LABEL_ALPHA),
        })}
      >
        {RESULT_STRIP_HEADING_LABEL}
      </Typography>
      <Box
        component="div"
        sx={(theme) => ({
          fontFamily: theme.typography.h4.fontFamily,
          fontWeight: FONT_WEIGHT_DISPLAY,
          fontSize: theme.typography.pxToRem(RESULT_STRIP_VALUE_PX),
          lineHeight: 1.1,
          textTransform: "none",
          color: theme.palette.success.main,
        })}
      >
        {formatResult(result)}
      </Box>
    </Box>
  </Stack>
);
