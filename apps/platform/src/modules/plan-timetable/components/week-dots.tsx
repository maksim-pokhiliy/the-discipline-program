import { type ReactElement } from "react";

import { Box, Stack, useTheme } from "@mui/material";

import { DOT_HEIGHT_PX, DOT_TRANSITION_MS } from "../utils/plan-timetable.constants";
import { resolveDotStyle } from "../utils/timetable-presentation";

export type WeekDotsProps = {
  weekCount: number;
  viewedIndex: number;
  todayWeekIndex: number | null;
};

export const WeekDots = ({
  weekCount,
  viewedIndex,
  todayWeekIndex,
}: WeekDotsProps): ReactElement => {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center">
      {Array.from({ length: weekCount }, (_, index) => {
        const dot = resolveDotStyle({ index, viewedIndex, todayWeekIndex }, theme);

        return (
          <Box
            key={index}
            sx={{
              height: DOT_HEIGHT_PX,
              width: dot.width,
              borderRadius: DOT_HEIGHT_PX / 2,
              bgcolor: dot.bg,
              transition: `width ${DOT_TRANSITION_MS}ms, background-color ${DOT_TRANSITION_MS}ms`,
            }}
          />
        );
      })}
    </Stack>
  );
};
