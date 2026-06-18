import { type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { alpha, Box, ButtonBase, Stack, Typography } from "@mui/material";

import { type SessionCardView } from "@repo/contracts/lms/plan-timetable";

import {
  CARD_ACTIVE_ALPHA,
  CARD_PADDING_X,
  CARD_PADDING_Y,
  CARD_SUBTITLE_PX,
  CARD_TITLE_PX,
  CHIP_LETTER_SPACING,
  FONT_WEIGHT_SEMI_BOLD,
  PILL_RADIUS_PX,
  TODAY_CHIP_BG_ALPHA,
  TODAY_CHIP_HEIGHT_PX,
  TODAY_CHIP_LABEL,
  TODAY_CHIP_PADDING_X_PX,
  TODAY_CHIP_PX,
  TRAIL_ICON_PX,
} from "../utils/plan-timetable.constants";
import { type CardDecoration } from "../utils/timetable-presentation";

export type SessionCardProps = {
  card: SessionCardView;
  isToday: boolean;
  decoration: CardDecoration;
  onOpenSession: (sessionId: string) => void;
};

const ellipsisSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

export const SessionCard = ({
  card,
  isToday,
  decoration,
  onOpenSession,
}: SessionCardProps): ReactElement => (
  <ButtonBase
    onClick={() => onOpenSession(card.sessionId)}
    sx={(theme) => ({
      display: "flex",
      width: "100%",
      textAlign: "left",
      alignItems: "center",
      gap: { xs: 1.5, md: 1.75 },
      px: { xs: `${CARD_PADDING_X.xs}px`, md: `${CARD_PADDING_X.md}px` },
      py: { xs: `${CARD_PADDING_Y.xs}px`, md: `${CARD_PADDING_Y.md}px` },
      borderRadius: theme.spacing(0.5),
      border: decoration.cardBorder,
      bgcolor: theme.palette.background.paper,
      cursor: "pointer",
      transition: theme.transitions.create(["border-color", "background-color"]),
      "&:hover": { borderColor: decoration.hoverBorder },
      "&:active": { bgcolor: alpha(theme.palette.common.white, CARD_ACTIVE_ALPHA) },
    })}
  >
    <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: {
              xs: theme.typography.pxToRem(CARD_TITLE_PX.xs),
              md: theme.typography.pxToRem(CARD_TITLE_PX.md),
            },
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            color: decoration.titleColor,
            minWidth: 0,
            ...ellipsisSx,
          })}
        >
          {card.title}
        </Typography>
        {isToday ? (
          <Box
            component="span"
            sx={(theme) => ({
              flexShrink: 0,
              height: TODAY_CHIP_HEIGHT_PX,
              display: "inline-flex",
              alignItems: "center",
              px: `${TODAY_CHIP_PADDING_X_PX}px`,
              borderRadius: `${PILL_RADIUS_PX}px`,
              bgcolor: alpha(theme.palette.primary.main, TODAY_CHIP_BG_ALPHA),
              color: theme.palette.primary.main,
              fontSize: theme.typography.pxToRem(TODAY_CHIP_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              letterSpacing: CHIP_LETTER_SPACING,
              textTransform: "uppercase",
            })}
          >
            {TODAY_CHIP_LABEL}
          </Box>
        ) : null}
      </Stack>
      {card.subtitle !== null ? (
        <Typography
          component="span"
          sx={{
            fontSize: (theme) => theme.typography.pxToRem(CARD_SUBTITLE_PX),
            color: "text.secondary",
            ...ellipsisSx,
          }}
        >
          {card.subtitle}
        </Typography>
      ) : null}
    </Stack>

    {decoration.trailIcon === "done" ? (
      <CheckCircleRounded
        sx={{ flexShrink: 0, fontSize: TRAIL_ICON_PX, color: decoration.trailColor }}
      />
    ) : (
      <ChevronRightRounded
        sx={{ flexShrink: 0, fontSize: TRAIL_ICON_PX, color: decoration.trailColor }}
      />
    )}
  </ButtonBase>
);
