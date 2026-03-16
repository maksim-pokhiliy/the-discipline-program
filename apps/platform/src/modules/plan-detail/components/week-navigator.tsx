"use client";

import { useCallback, useMemo } from "react";

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
  parseDateParam,
} from "./week-helpers";

export const useWeekStart = (): Date => {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");

  return useMemo(
    () => (weekParam ? getMonday(parseDateParam(weekParam)) : getMonday(new Date())),
    [weekParam],
  );
};

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
    <Stack direction="row" sx={{ alignItems: "center", position: "relative" }}>
      <Stack direction="row" sx={{ flex: 1, justifyContent: "flex-start" }}>
        <IconButton onClick={() => navigate(addDays(weekStart, -7))} size="small">
          <ChevronLeftIcon />
        </IconButton>
      </Stack>

      <Stack sx={{ alignItems: "center" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Week {weekNumber}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {formatWeekRange(weekStart)}
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ flex: 1, justifyContent: "flex-end" }}>
        <IconButton onClick={() => navigate(addDays(weekStart, 7))} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {!isCurrentWeek && (
        <Button
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
