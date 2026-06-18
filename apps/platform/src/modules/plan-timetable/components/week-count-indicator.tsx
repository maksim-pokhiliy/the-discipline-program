import { type ReactElement } from "react";

import { Typography } from "@mui/material";

import { WEEK_COUNT_INDICATOR_PX } from "../utils/plan-timetable.constants";

export type WeekCountIndicatorProps = {
  label: string;
};

export const WeekCountIndicator = ({ label }: WeekCountIndicatorProps): ReactElement => (
  <Typography
    component="span"
    sx={(theme) => ({
      display: "block",
      textAlign: "center",
      fontSize: theme.typography.pxToRem(WEEK_COUNT_INDICATOR_PX),
      color: theme.palette.text.secondary,
    })}
  >
    {label}
  </Typography>
);
