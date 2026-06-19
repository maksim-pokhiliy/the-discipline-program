import { type ReactElement } from "react";

import { Box } from "@mui/material";

import {
  DISPLAY_NUMBER_LETTER_SPACING,
  DISPLAY_NUMBER_LINE_HEIGHT,
  FONT_WEIGHT_DISPLAY,
} from "../utils/athlete-records.constants";

export type DisplayNumberProps = {
  value: string;
  sizePx: number;
  color?: string;
};

export const DisplayNumber = ({ value, sizePx, color }: DisplayNumberProps): ReactElement => (
  <Box
    component="span"
    sx={(theme) => ({
      fontFamily: theme.typography.h4.fontFamily,
      fontWeight: FONT_WEIGHT_DISPLAY,
      fontSize: theme.typography.pxToRem(sizePx),
      lineHeight: DISPLAY_NUMBER_LINE_HEIGHT,
      letterSpacing: DISPLAY_NUMBER_LETTER_SPACING,
      textTransform: "none",
      color: color ?? theme.palette.text.primary,
    })}
  >
    {value}
  </Box>
);
