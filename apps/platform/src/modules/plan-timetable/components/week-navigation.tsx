import { type ReactElement } from "react";

import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { IconButton, Stack, Typography } from "@mui/material";

import {
  DATE_RANGE_PX,
  FONT_WEIGHT_DISPLAY,
  NAV_BUTTON_PX,
  NAV_CHEVRON_PX,
  NAV_DISABLED_OPACITY,
  WEEK_LABEL_LETTER_SPACING,
  WEEK_LABEL_PX,
} from "../utils/plan-timetable.constants";

export type WeekNavigationProps = {
  weekLabel: string;
  dateRange: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const boundSx = (isEnabled: boolean): { opacity?: number; pointerEvents?: "none" } =>
  isEnabled ? {} : { opacity: NAV_DISABLED_OPACITY, pointerEvents: "none" };

export const WeekNavigation = ({
  weekLabel,
  dateRange,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: WeekNavigationProps): ReactElement => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
    <IconButton
      aria-label="Previous week"
      onClick={onPrev}
      sx={{ width: NAV_BUTTON_PX, height: NAV_BUTTON_PX, ...boundSx(canPrev) }}
    >
      <ChevronLeftRounded sx={{ fontSize: NAV_CHEVRON_PX }} />
    </IconButton>

    <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        component="span"
        sx={(theme) => ({
          fontFamily: "var(--font-display)",
          fontWeight: FONT_WEIGHT_DISPLAY,
          fontSize: {
            xs: theme.typography.pxToRem(WEEK_LABEL_PX.xs),
            md: theme.typography.pxToRem(WEEK_LABEL_PX.md),
          },
          lineHeight: 1,
          letterSpacing: WEEK_LABEL_LETTER_SPACING,
          textTransform: "uppercase",
          color: theme.palette.text.primary,
        })}
      >
        {weekLabel}
      </Typography>
      <Typography
        component="span"
        sx={(theme) => ({
          fontSize: {
            xs: theme.typography.pxToRem(DATE_RANGE_PX.xs),
            md: theme.typography.pxToRem(DATE_RANGE_PX.md),
          },
          color: theme.palette.text.secondary,
        })}
      >
        {dateRange}
      </Typography>
    </Stack>

    <IconButton
      aria-label="Next week"
      onClick={onNext}
      sx={{ width: NAV_BUTTON_PX, height: NAV_BUTTON_PX, ...boundSx(canNext) }}
    >
      <ChevronRightRounded sx={{ fontSize: NAV_CHEVRON_PX }} />
    </IconButton>
  </Stack>
);
