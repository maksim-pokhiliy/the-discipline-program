import { type ReactElement } from "react";

import { alpha, Typography } from "@mui/material";

export type LoadSubLineProps = {
  text: string;
  px: number;
  alphaValue: number;
};

export const LoadSubLine = ({ text, px, alphaValue }: LoadSubLineProps): ReactElement => (
  <Typography
    component="div"
    sx={(theme) => ({
      mt: 0.5,
      fontSize: theme.typography.pxToRem(px),
      color: alpha(theme.palette.common.white, alphaValue),
    })}
  >
    {text}
  </Typography>
);
