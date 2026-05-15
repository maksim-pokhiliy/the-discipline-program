"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { IconButton, Stack, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { isValid } from "date-fns";

import { addDays, DAYS_IN_WEEK, formatWeekRange, getISOWeekNumber, getMonday } from "@repo/shared";

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

  return (
    <Stack spacing={1} alignItems="flex-end">
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          aria-label="Previous week"
          onClick={() => onChange(addDays(monday, -DAYS_IN_WEEK))}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="subtitle1">
          {`${formatWeekRange(monday)} · W${getISOWeekNumber(monday)}`}
        </Typography>
        <IconButton aria-label="Next week" onClick={() => onChange(addDays(monday, DAYS_IN_WEEK))}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      <Stack direction="row">
        <DatePicker
          label="Jump to date"
          value={monday}
          onChange={handleDateChange}
          slotProps={{
            textField: { size: "small" },
            actionBar: { actions: ["today"] },
          }}
        />
      </Stack>
    </Stack>
  );
};
