import { Stack } from "@mui/material";

import { formatDateParam, getWeekDays } from "@repo/shared";

import { DayRow } from "./day-row";

type WeekGridProps = {
  monday: Date;
};

export const WeekGrid: React.FC<WeekGridProps> = ({ monday }) => (
  <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
    {getWeekDays(monday).map((date) => (
      <DayRow key={formatDateParam(date)} date={date} />
    ))}
  </Stack>
);
