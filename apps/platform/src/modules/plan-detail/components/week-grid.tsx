import { Stack } from "@mui/material";

import { dayOfWeekValues } from "@repo/contracts/lms/_shared";
import type { DaySlot } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";
import { formatDateParam, getWeekDays } from "@repo/shared";

import { DayRow } from "./day-row";

type WeekGridProps = {
  planId: string;
  monday: Date;
  days: DaySlot[];
  labelOptions: Label[];
  labelOptionsLoading: boolean;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};

export const WeekGrid: React.FC<WeekGridProps> = ({
  planId,
  monday,
  days,
  labelOptions,
  labelOptionsLoading,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const startDate = formatDateParam(monday);
  const dates = getWeekDays(monday);

  return (
    <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
      {dayOfWeekValues.map((dayOfWeek, idx) => {
        const date = dates[idx];

        if (!date) {
          return null;
        }

        const day = days.find((d) => d.dayOfWeek === dayOfWeek);

        return (
          <DayRow
            key={formatDateParam(date)}
            date={date}
            planId={planId}
            startDate={startDate}
            dayOfWeek={dayOfWeek}
            label={day?.label ?? null}
            notes={day?.notes ?? null}
            sessions={day?.sessions ?? []}
            labelOptions={labelOptions}
            labelOptionsLoading={labelOptionsLoading}
            sessionLabelOptions={sessionLabelOptions}
            sessionLabelOptionsLoading={sessionLabelOptionsLoading}
          />
        );
      })}
    </Stack>
  );
};
