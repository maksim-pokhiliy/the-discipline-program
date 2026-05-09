"use client";

import { Divider, Stack } from "@mui/material";

import { formatDateParam, getWeekDays, isSameDay } from "@repo/shared";

import { DayRow, type Lookups } from "../components";
import { type DayBucket } from "../lib";

type WeekGridSectionProps = {
  planId: string;
  weekStart: Date;
  dayBuckets: ReadonlyMap<string, DayBucket>;
  lookups: Lookups;
  onEditDay: (date: Date, dayId: string | null) => void;
  onEditSession: (dayId: string, sessionId: string) => void;
  onAddBlock: (sessionId: string) => void;
  onEditBlock: (sessionId: string, blockId: string) => void;
};

export const WeekGridSection: React.FC<WeekGridSectionProps> = ({
  planId,
  weekStart,
  dayBuckets,
  lookups,
  onEditDay,
  onEditSession,
  onAddBlock,
  onEditBlock,
}) => {
  const today = new Date();

  return (
    <Stack divider={<Divider />} spacing={0}>
      {getWeekDays(weekStart).map((date) => {
        const bucket = dayBuckets.get(formatDateParam(date));

        return (
          <DayRow
            key={formatDateParam(date)}
            planId={planId}
            date={date}
            isToday={isSameDay(date, today)}
            planDayId={bucket?.planDayId ?? null}
            dayType={bucket?.dayType ?? null}
            lookups={lookups}
            onEditDay={onEditDay}
            onEditSession={onEditSession}
            onAddBlock={onAddBlock}
            onEditBlock={onEditBlock}
          />
        );
      })}
    </Stack>
  );
};
