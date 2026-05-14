"use client";

import type { ChangeEvent } from "react";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, IconButton, Stack, TextField, Typography } from "@mui/material";

import {
  addDays,
  DAYS_IN_WEEK,
  formatDateParam,
  formatWeekRange,
  getISOWeekNumber,
  getMonday,
  parseDateParam,
} from "@repo/shared";

type WeekNavigatorProps = {
  monday: Date;
  onChange: (next: Date) => void;
};

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({ monday, onChange }) => {
  const handleJumpToDate = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDateParam(event.target.value);

    if (parsed) {
      onChange(getMonday(parsed));
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <IconButton
        aria-label="Previous week"
        onClick={() => onChange(addDays(monday, -DAYS_IN_WEEK))}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton aria-label="Next week" onClick={() => onChange(addDays(monday, DAYS_IN_WEEK))}>
        <ChevronRightIcon />
      </IconButton>

      <Typography variant="subtitle1" sx={{ flex: 1, minWidth: 200 }}>
        {`${formatWeekRange(monday)} · W${getISOWeekNumber(monday)}`}
      </Typography>

      <Button size="small" variant="outlined" onClick={() => onChange(getMonday(new Date()))}>
        Today
      </Button>

      <TextField
        type="date"
        size="small"
        label="Jump to date"
        value={formatDateParam(monday)}
        onChange={handleJumpToDate}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Stack>
  );
};
