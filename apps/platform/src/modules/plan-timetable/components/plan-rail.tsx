import { type ReactElement } from "react";

import { alpha, Box, ButtonBase, Stack, Typography } from "@mui/material";

import {
  FONT_WEIGHT_SEMI_BOLD,
  PILL_RADIUS_PX,
  PLAN_ACTIVE_SUFFIX,
  PLAN_RAIL_EYEBROW_LABEL,
  PLAN_RAIL_PAD_X,
  RAIL_BAR_HEIGHT_PX,
  RAIL_BAR_TRACK_ALPHA,
  RAIL_CARD_PADDING_PX,
  RAIL_CARD_SELECTED_BG_ALPHA,
  RAIL_CARD_TITLE_PX,
  RAIL_EYEBROW_PX,
  RAIL_HEADER_PB,
  RAIL_META_PX,
  RAIL_PAD_Y,
  WEEKDAY_LETTER_SPACING,
} from "../utils/plan-timetable.constants";
import { type PlanRailItem } from "../utils/timetable-presentation";

export type PlanRailProps = {
  items: PlanRailItem[];
  onSelect: (planId: string) => void;
};

export const PlanRail = ({ items, onSelect }: PlanRailProps): ReactElement => (
  <Box>
    <Stack
      direction="row"
      alignItems="baseline"
      justifyContent="space-between"
      sx={(theme) => ({
        position: "sticky",
        top: 0,
        zIndex: 1,
        px: PLAN_RAIL_PAD_X,
        pt: RAIL_PAD_Y,
        pb: RAIL_HEADER_PB,
        bgcolor: theme.palette.background.default,
      })}
    >
      <Typography
        component="span"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(RAIL_EYEBROW_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          letterSpacing: WEEKDAY_LETTER_SPACING,
          textTransform: "uppercase",
          color: theme.palette.text.secondary,
        })}
      >
        {PLAN_RAIL_EYEBROW_LABEL}
      </Typography>
      <Typography
        component="span"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(RAIL_EYEBROW_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          color: theme.palette.text.muted,
        })}
      >
        {`${items.length} ${PLAN_ACTIVE_SUFFIX}`}
      </Typography>
    </Stack>

    <Stack spacing={1.5} sx={{ px: PLAN_RAIL_PAD_X, pb: RAIL_PAD_Y }}>
      {items.map((item) => (
        <ButtonBase
          key={item.planId}
          onClick={() => onSelect(item.planId)}
          sx={(theme) => ({
            display: "block",
            width: "100%",
            textAlign: "left",
            p: `${RAIL_CARD_PADDING_PX}px`,
            borderRadius: theme.spacing(0.5),
            border: item.selected
              ? `1.5px solid ${theme.palette.primary.main}`
              : `1px solid ${theme.palette.divider}`,
            bgcolor: item.selected
              ? alpha(theme.palette.primary.main, RAIL_CARD_SELECTED_BG_ALPHA)
              : theme.palette.background.paper,
            transition: theme.transitions.create("border-color"),
            "&:hover": {
              borderColor: item.selected ? theme.palette.primary.main : theme.palette.dividerStrong,
            },
          })}
        >
          <Typography
            component="span"
            sx={(theme) => ({
              display: "block",
              fontSize: theme.typography.pxToRem(RAIL_CARD_TITLE_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              lineHeight: 1.3,
              color: item.selected ? theme.palette.primary.main : theme.palette.text.primary,
            })}
          >
            {item.title}
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={1}
            sx={(theme) => ({
              mt: 1,
              fontSize: theme.typography.pxToRem(RAIL_META_PX),
              color: theme.palette.text.secondary,
            })}
          >
            <Box component="span" sx={{ whiteSpace: "nowrap" }}>
              {item.weekOf}
            </Box>
            <Box component="span" sx={{ whiteSpace: "nowrap" }}>
              {item.progressText}
            </Box>
          </Stack>

          <Box
            sx={(theme) => ({
              mt: 1.25,
              height: `${RAIL_BAR_HEIGHT_PX}px`,
              borderRadius: `${PILL_RADIUS_PX}px`,
              bgcolor: alpha(theme.palette.common.white, RAIL_BAR_TRACK_ALPHA),
              overflow: "hidden",
            })}
          >
            <Box
              sx={(theme) => ({
                height: "100%",
                width: `${item.barPct}%`,
                bgcolor: theme.palette.primary.main,
                borderRadius: `${PILL_RADIUS_PX}px`,
              })}
            />
          </Box>
        </ButtonBase>
      ))}
    </Stack>
  </Box>
);
