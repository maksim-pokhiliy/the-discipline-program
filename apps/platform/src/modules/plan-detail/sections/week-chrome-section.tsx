"use client";

import { useCallback, useEffect, useRef } from "react";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, IconButton, Stack, TextField, Typography } from "@mui/material";

import {
  addDays,
  formatDateParam,
  formatWeekRange,
  getISOWeekNumber,
  getMonday,
  isSameDay,
  parseDateParam,
} from "@repo/shared";

const WEEK_LENGTH_DAYS = 7;
const ARROW_HOVER_DEBOUNCE_MS = 50;

type WeekChromeSectionProps = {
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  onArrowHover?: (direction: "prev" | "next") => void;
};

export const WeekChromeSection: React.FC<WeekChromeSectionProps> = ({
  weekStart,
  onWeekChange,
  onArrowHover,
}) => {
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
      }
    },
    [],
  );

  const scheduleHover = useCallback(
    (direction: "prev" | "next") => {
      if (!onArrowHover) {
        return;
      }

      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
      }

      hoverTimerRef.current = setTimeout(() => {
        onArrowHover(direction);
      }, ARROW_HOVER_DEBOUNCE_MS);
    },
    [onArrowHover],
  );

  const todayMonday = getMonday(new Date());
  const isOnCurrentWeek = isSameDay(weekStart, todayMonday);
  const weekLabel = `week ${getISOWeekNumber(weekStart)} · ${formatWeekRange(weekStart)}`;

  const handlePrev = (): void => onWeekChange(addDays(weekStart, -WEEK_LENGTH_DAYS));
  const handleNext = (): void => onWeekChange(addDays(weekStart, WEEK_LENGTH_DAYS));
  const handleToday = (): void => onWeekChange(todayMonday);
  const handlePick = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;

    if (!value) {
      return;
    }

    onWeekChange(getMonday(parseDateParam(value)));
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <IconButton
        aria-label="Previous week"
        onClick={handlePrev}
        onMouseEnter={() => scheduleHover("prev")}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="subtitle1">{weekLabel}</Typography>
      <IconButton
        aria-label="Next week"
        onClick={handleNext}
        onMouseEnter={() => scheduleHover("next")}
      >
        <ChevronRightIcon />
      </IconButton>
      {!isOnCurrentWeek ? (
        <Button onClick={handleToday} size="small">
          Today
        </Button>
      ) : null}
      <TextField
        type="date"
        size="small"
        value={formatDateParam(weekStart)}
        onChange={handlePick}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: (theme) => theme.spacing(20) }}
      />
    </Stack>
  );
};
