"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import { addDays, DAYS_IN_WEEK, formatWeekRange, getISOWeekNumber, getMonday } from "@repo/shared";

const ARROW_HOVER_DEBOUNCE_MS = 50;
const DATE_PICKER_MIN_WIDTH_UNITS = 22;

type ArrowDirection = "prev" | "next";

type WeekChromeSectionProps = {
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  onArrowHover?: (direction: ArrowDirection) => void;
};

export const WeekChromeSection: React.FC<WeekChromeSectionProps> = ({
  weekStart,
  onWeekChange,
  onArrowHover,
}) => {
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todayValue = useMemo(() => new Date(), []);

  useEffect(
    () => () => {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
      }
    },
    [],
  );

  const scheduleHover = useCallback(
    (direction: ArrowDirection) => {
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

  const handlePrev = useCallback(
    (): void => onWeekChange(addDays(weekStart, -DAYS_IN_WEEK)),
    [onWeekChange, weekStart],
  );

  const handleNext = useCallback(
    (): void => onWeekChange(addDays(weekStart, DAYS_IN_WEEK)),
    [onWeekChange, weekStart],
  );

  const handleToday = useCallback((): void => {
    onWeekChange(getMonday(new Date()));
  }, [onWeekChange]);

  const handlePick = useCallback(
    (value: Date | null): void => {
      if (value === null || Number.isNaN(value.getTime())) {
        return;
      }

      onWeekChange(getMonday(value));
    },
    [onWeekChange],
  );

  const weekNumberLabel = `Week ${getISOWeekNumber(weekStart)}`;
  const weekRangeLabel = formatWeekRange(weekStart);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack alignItems="center" justifyContent="center" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            aria-label="Previous week"
            onClick={handlePrev}
            onMouseEnter={() => scheduleHover("prev")}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Stack alignItems="center">
            <Typography variant="subtitle1">{weekNumberLabel}</Typography>
            <Typography variant="body2" color="text.secondary">
              {weekRangeLabel}
            </Typography>
          </Stack>
          <IconButton
            aria-label="Next week"
            onClick={handleNext}
            onMouseEnter={() => scheduleHover("next")}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button onClick={handleToday} size="small">
            Today
          </Button>
          <DatePicker
            value={todayValue}
            onChange={handlePick}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: (theme) => theme.spacing(DATE_PICKER_MIN_WIDTH_UNITS) },
              },
            }}
          />
        </Stack>
      </Stack>
    </LocalizationProvider>
  );
};
