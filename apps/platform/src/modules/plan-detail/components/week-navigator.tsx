"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import { Button, Card, Chip, IconButton, Stack, Typography } from "@mui/material";
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
          <Chip variant="indicator" color="primary" label={`W ${getISOWeekNumber(monday)}`} />
          <IconButton
            size="large"
            aria-label="Next week"
            onClick={() => onChange(addDays(monday, DAYS_IN_WEEK))}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <DatePicker
            value={monday}
            onChange={handleDateChange}
            slotProps={{ textField: { size: "small" } }}
          />
          <Button
            size="small"
            variant="outlined"
            color={isToday ? "primary" : "inherit"}
            startIcon={<TodayIcon fontSize="small" />}
            onClick={() => onChange(getMonday(new Date()))}
            {...(!isToday && { sx: { borderColor: "divider" } })}
          >
            Today
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};
