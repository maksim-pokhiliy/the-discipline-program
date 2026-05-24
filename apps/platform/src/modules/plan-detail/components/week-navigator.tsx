"use client";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { Card, IconButton, Stack, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { isValid } from "date-fns";

import {
  addDays,
  DAYS_IN_WEEK,
  formatDateParam,
  formatWeekRange,
  getISOWeekNumber,
  getMonday,
} from "@repo/shared";
import { IndicatorChip } from "@repo/ui";

type WeekNavigatorProps = {
  monday: Date;
  onChange: (next: Date) => void;
};

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({ monday, onChange }) => {
  const handleDateChange = (next: Date | null) => {
    if (next && isValid(next)) {
      onChange(getMonday(next));
    }
  };

  const isToday = formatDateParam(monday) === formatDateParam(getMonday(new Date()));

  return (
    <Card variant="outlined" sx={{ p: 1.25, px: 1.75 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton
            size="large"
            aria-label="Previous week"
            onClick={() => onChange(addDays(monday, -DAYS_IN_WEEK))}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h4">{formatWeekRange(monday)}</Typography>
          <IndicatorChip tone="primary" label={`W ${getISOWeekNumber(monday)}`} />
          <IconButton
            size="large"
            aria-label="Next week"
            onClick={() => onChange(addDays(monday, DAYS_IN_WEEK))}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <CalendarMonthIcon fontSize="small" color="action" />
            <DatePicker
              value={monday}
              onChange={handleDateChange}
              slotProps={{ textField: { size: "small" } }}
            />
          </Stack>
          <IndicatorChip
            tone={isToday ? "primary" : "default"}
            label="Today"
            clickable
            onClick={() => onChange(getMonday(new Date()))}
            icon={<EventAvailableIcon fontSize="small" />}
          />
        </Stack>
      </Stack>
    </Card>
  );
};
