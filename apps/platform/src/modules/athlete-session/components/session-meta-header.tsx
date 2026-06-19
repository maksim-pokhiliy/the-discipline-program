import { type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import EventRounded from "@mui/icons-material/EventRounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type SessionHeaderView } from "@repo/contracts/lms/session-detail";

import { formatSessionDate } from "../utils/athlete-session-presentation";
import {
  DONE_PILL_BG_ALPHA,
  DONE_PILL_HEIGHT_PX,
  DONE_PILL_ICON_PX,
  DONE_PILL_LABEL,
  DONE_PILL_PADDING_X_PX,
  DONE_PILL_PX,
  EYEBROW_LETTER_SPACING,
  FONT_WEIGHT_SEMI_BOLD,
  META_EYEBROW_PX,
  META_ICON_PX,
  META_LINE_PX,
  META_TITLE_PX,
  PILL_LETTER_SPACING,
  PILL_RADIUS_PX,
  SUMMARY_SEPARATOR,
} from "../utils/athlete-session.constants";

export type SessionMetaHeaderProps = {
  session: SessionHeaderView;
};

export const SessionMetaHeader = ({ session }: SessionMetaHeaderProps): ReactElement => (
  <Box component="header">
    <Typography
      component="div"
      sx={(theme) => ({
        fontSize: theme.typography.pxToRem(META_EYEBROW_PX),
        fontWeight: FONT_WEIGHT_SEMI_BOLD,
        letterSpacing: EYEBROW_LETTER_SPACING,
        textTransform: "uppercase",
        color: theme.palette.text.muted,
      })}
    >
      {session.position}
    </Typography>

    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mt: 1 }}
    >
      <Typography
        component="h2"
        sx={(theme) => ({
          fontFamily: theme.typography.body1.fontFamily,
          fontSize: {
            xs: theme.typography.pxToRem(META_TITLE_PX.xs),
            md: theme.typography.pxToRem(META_TITLE_PX.md),
          },
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          lineHeight: 1.15,
          textTransform: "uppercase",
          color: theme.palette.text.primary,
        })}
      >
        {session.title}
      </Typography>

      {session.done ? (
        <Stack
          component="span"
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={(theme) => ({
            flexShrink: 0,
            height: DONE_PILL_HEIGHT_PX,
            px: `${DONE_PILL_PADDING_X_PX}px`,
            borderRadius: `${PILL_RADIUS_PX}px`,
            bgcolor: alpha(theme.palette.success.main, DONE_PILL_BG_ALPHA),
            color: theme.palette.success.main,
          })}
        >
          <CheckCircleRounded sx={{ fontSize: DONE_PILL_ICON_PX }} />
          <Box
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(DONE_PILL_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              letterSpacing: PILL_LETTER_SPACING,
              textTransform: "uppercase",
            })}
          >
            {DONE_PILL_LABEL}
          </Box>
        </Stack>
      ) : null}
    </Stack>

    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={(theme) => ({ mt: 1, color: theme.palette.text.secondary })}
    >
      <EventRounded
        sx={(theme) => ({ fontSize: META_ICON_PX, color: theme.palette.text.disabled })}
      />
      <Typography
        component="span"
        sx={(theme) => ({ fontSize: theme.typography.pxToRem(META_LINE_PX) })}
      >
        {formatSessionDate(session)}
      </Typography>
      <Box component="span" sx={(theme) => ({ color: theme.palette.text.faint })}>
        {SUMMARY_SEPARATOR.trim()}
      </Box>
      <Typography
        component="span"
        sx={(theme) => ({ fontSize: theme.typography.pxToRem(META_LINE_PX) })}
      >
        {session.summary}
      </Typography>
    </Stack>
  </Box>
);
