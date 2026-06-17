import { type ReactElement } from "react";

import MyLocationRounded from "@mui/icons-material/MyLocationRounded";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";

import {
  ACTION_ICON_PX,
  ACTION_LETTER_SPACING,
  ACTION_TEXT_PX,
  FONT_WEIGHT_SEMI_BOLD,
  PROGRESS_TEXT_PX,
  TODAY_JUMP_LABEL_LONG,
  TODAY_JUMP_LABEL_SHORT,
} from "../utils/plan-timetable.constants";

export type TimetableProgressRowProps = {
  done: number;
  total: number;
  showTodayButton: boolean;
  onJumpToToday: () => void;
};

export const TimetableProgressRow = ({
  done,
  total,
  showTodayButton,
  onJumpToToday,
}: TimetableProgressRowProps): ReactElement => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
    <Typography
      component="span"
      sx={(theme) => ({
        fontSize: {
          xs: theme.typography.pxToRem(PROGRESS_TEXT_PX.xs),
          md: theme.typography.pxToRem(PROGRESS_TEXT_PX.md),
        },
        color: theme.palette.text.secondary,
      })}
    >
      {`${done} of ${total} done`}
    </Typography>

    {showTodayButton ? (
      <ButtonBase
        onClick={onJumpToToday}
        sx={(theme) => ({
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: theme.palette.primary.main,
          fontSize: theme.typography.pxToRem(ACTION_TEXT_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          letterSpacing: ACTION_LETTER_SPACING,
          textTransform: "uppercase",
        })}
      >
        <MyLocationRounded sx={{ fontSize: ACTION_ICON_PX }} />
        <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>
          {TODAY_JUMP_LABEL_SHORT}
        </Box>
        <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
          {TODAY_JUMP_LABEL_LONG}
        </Box>
      </ButtonBase>
    ) : null}
  </Stack>
);
