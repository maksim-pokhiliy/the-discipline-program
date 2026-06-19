import { type ReactElement } from "react";

import { alpha, Box, Typography } from "@mui/material";

import {
  FONT_WEIGHT_SEMI_BOLD,
  REST_CARD_PAD_X,
  REST_CARD_PAD_Y,
  REST_CARD_STRIPE_ALPHA,
  REST_CARD_SURFACE_ALPHA,
  REST_DAY_PX,
  REST_STRIPE_PERIOD_PX,
  REST_STRIPE_TRANSPARENT_PX,
  WEEKDAY_LETTER_SPACING,
} from "../utils/plan-timetable.constants";

export type RestDayCardProps = {
  label: string;
};

export const RestDayCard = ({ label }: RestDayCardProps): ReactElement => (
  <Box
    sx={(theme) => ({
      borderRadius: theme.spacing(0.5),
      border: `1px dashed ${theme.palette.dividerStrong}`,
      px: REST_CARD_PAD_X,
      py: REST_CARD_PAD_Y,
      bgcolor: alpha(theme.palette.primary.main, REST_CARD_SURFACE_ALPHA),
      backgroundImage: `repeating-linear-gradient(135deg, transparent 0 ${REST_STRIPE_TRANSPARENT_PX}px, ${alpha(
        theme.palette.primary.main,
        REST_CARD_STRIPE_ALPHA,
      )} ${REST_STRIPE_TRANSPARENT_PX}px ${REST_STRIPE_PERIOD_PX}px)`,
    })}
  >
    <Typography
      component="span"
      sx={(theme) => ({
        fontSize: theme.typography.pxToRem(REST_DAY_PX),
        fontWeight: FONT_WEIGHT_SEMI_BOLD,
        letterSpacing: WEEKDAY_LETTER_SPACING,
        textTransform: "uppercase",
        color: theme.palette.text.secondary,
      })}
    >
      {label}
    </Typography>
  </Box>
);
