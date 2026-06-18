import { type ReactElement } from "react";

import { Box } from "@mui/material";

import { FONT_WEIGHT_DISPLAY } from "../utils/athlete-session.constants";

export type DisplayNumberProps = {
  value: string;
  px: number;
  color?: string;
};

export const DisplayNumber = ({ value, px, color }: DisplayNumberProps): ReactElement => (
  <Box
    component="span"
    sx={(theme) => ({
      fontFamily: theme.typography.h4.fontFamily,
      fontWeight: FONT_WEIGHT_DISPLAY,
      fontSize: theme.typography.pxToRem(px),
      lineHeight: 1,
      letterSpacing: "normal",
      textTransform: "none",
      color: color ?? theme.palette.text.primary,
    })}
  >
    {value}
  </Box>
);
