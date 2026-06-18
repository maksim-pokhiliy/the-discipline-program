import { type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { alpha, Box, ButtonBase, Stack, Typography } from "@mui/material";

import {
  FONT_WEIGHT_SEMI_BOLD,
  PLAN_RAIL_PAD_X,
  PLAN_WEEKS_EYEBROW_LABEL,
  RAIL_EYEBROW_PX,
  RAIL_HEADER_PB,
  RAIL_PAD_Y,
  WEEKDAY_LETTER_SPACING,
  WEEKS_NAV_CHECK_PX,
  WEEKS_NAV_INDENT_PX,
  WEEKS_NAV_LABEL_PX,
  WEEKS_NAV_META_PX,
  WEEKS_NAV_SELECTED_BG_ALPHA,
  WEEKS_NAV_SELECTED_BORDER_ALPHA,
  WEEKS_NAV_TODAY_DOT_PX,
} from "../utils/plan-timetable.constants";
import { type WeeksNavItem } from "../utils/timetable-presentation";

export type PlanWeeksNavProps = {
  items: WeeksNavItem[];
  onSelectWeek: (index: number) => void;
};

export const PlanWeeksNav = ({ items, onSelectWeek }: PlanWeeksNavProps): ReactElement => (
  <Box>
    <Typography
      component="span"
      sx={(theme) => ({
        position: "sticky",
        top: 0,
        zIndex: 1,
        display: "block",
        px: PLAN_RAIL_PAD_X,
        pt: RAIL_PAD_Y,
        pb: RAIL_HEADER_PB,
        bgcolor: theme.palette.background.default,
        fontSize: theme.typography.pxToRem(RAIL_EYEBROW_PX),
        fontWeight: FONT_WEIGHT_SEMI_BOLD,
        letterSpacing: WEEKDAY_LETTER_SPACING,
        textTransform: "uppercase",
        color: theme.palette.text.secondary,
      })}
    >
      {PLAN_WEEKS_EYEBROW_LABEL}
    </Typography>

    <Stack spacing={0.5} sx={{ px: PLAN_RAIL_PAD_X, pb: RAIL_PAD_Y }}>
      {items.map((item) => (
        <ButtonBase
          key={item.index}
          onClick={() => onSelectWeek(item.index)}
          sx={(theme) => ({
            display: "block",
            width: "100%",
            textAlign: "left",
            px: 1.375,
            py: 1.125,
            borderRadius: theme.spacing(0.5),
            border: `1px solid ${
              item.selected
                ? alpha(theme.palette.primary.main, WEEKS_NAV_SELECTED_BORDER_ALPHA)
                : "transparent"
            }`,
            bgcolor: item.selected
              ? alpha(theme.palette.primary.main, WEEKS_NAV_SELECTED_BG_ALPHA)
              : "transparent",
            transition: theme.transitions.create("background-color"),
            ...(item.selected ? {} : { "&:hover": { bgcolor: theme.palette.action.hover } }),
          })}
        >
          <Stack direction="row" alignItems="center" spacing={0.875}>
            {item.isToday ? (
              <Box
                component="span"
                sx={(theme) => ({
                  flexShrink: 0,
                  width: WEEKS_NAV_TODAY_DOT_PX,
                  height: WEEKS_NAV_TODAY_DOT_PX,
                  borderRadius: "50%",
                  bgcolor: theme.palette.primary.main,
                })}
              />
            ) : null}
            <Typography
              component="span"
              sx={(theme) => ({
                flex: 1,
                minWidth: 0,
                fontSize: theme.typography.pxToRem(WEEKS_NAV_LABEL_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                color: item.selected ? theme.palette.primary.main : theme.palette.text.primary,
              })}
            >
              {item.label}
            </Typography>
            {item.allDone ? (
              <CheckCircleRounded
                sx={(theme) => ({
                  flexShrink: 0,
                  fontSize: WEEKS_NAV_CHECK_PX,
                  color: theme.palette.success.main,
                })}
              />
            ) : (
              <Typography
                component="span"
                sx={(theme) => ({
                  flexShrink: 0,
                  fontSize: theme.typography.pxToRem(WEEKS_NAV_META_PX),
                  fontWeight: FONT_WEIGHT_SEMI_BOLD,
                  color: theme.palette.text.muted,
                })}
              >
                {item.countText}
              </Typography>
            )}
          </Stack>
          <Typography
            component="span"
            sx={(theme) => ({
              display: "block",
              mt: 0.375,
              pl: item.isToday ? `${WEEKS_NAV_INDENT_PX}px` : 0,
              fontSize: theme.typography.pxToRem(WEEKS_NAV_META_PX),
              color: theme.palette.text.muted,
            })}
          >
            {item.range}
          </Typography>
        </ButtonBase>
      ))}
    </Stack>
  </Box>
);
