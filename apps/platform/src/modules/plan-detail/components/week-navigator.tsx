"use client";

import { useCallback } from "react";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  addDays,
  formatDateParam,
  formatWeekRange,
  getISOWeekNumber,
  getMonday,
} from "@repo/shared";

import { useWeekStart } from "@app/lib/hooks";

export const WeekNavigator = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const weekStart = useWeekStart();

  const navigate = useCallback(
    (date: Date) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("week", formatDateParam(date));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const weekNumber = getISOWeekNumber(weekStart);
  const isCurrentWeek = formatDateParam(weekStart) === formatDateParam(getMonday(new Date()));

  return (
    <Stack direction="row" alignItems="center" sx={{ position: "relative" }}>
      <Stack direction="row" justifyContent="flex-start" sx={{ flex: 1 }}>
        <IconButton onClick={() => navigate(addDays(weekStart, -7))}>
          <ChevronLeftIcon />
        </IconButton>
      </Stack>

      <Stack alignItems="center">
        <Typography variant="subtitle2">Week {weekNumber}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {formatWeekRange(weekStart)}
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
        <IconButton onClick={() => navigate(addDays(weekStart, 7))}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {!isCurrentWeek && (
        <Button
          variant="text"
          size="small"
          startIcon={<TodayIcon />}
          onClick={() => navigate(getMonday(new Date()))}
          sx={(theme) => ({ position: "absolute", right: theme.spacing(5) })}
        >
          Today
        </Button>
      )}
    </Stack>
  );
};
