"use client";

import { Alert, Skeleton, Stack } from "@mui/material";

import { type DayType } from "@repo/contracts/lms/day-type";

import { useSessionsByDay } from "@app/lib/hooks";

import { DayEmpty } from "./day-empty";
import { DayRowHeader } from "./day-row-header";
import { PlanSessionCard } from "./plan-session-card";
import { type Lookups } from "./types";

const SESSIONS_SKELETON_HEIGHT_PX = 96;

type DayRowProps = {
  planId: string;
  date: Date;
  planDayId: string | null;
  dayType: DayType | null;
  lookups: Lookups;
};

export const DayRow: React.FC<DayRowProps> = ({ planId, date, planDayId, dayType, lookups }) => {
  const hasDayType = dayType !== null;
  const sessionsQuery = useSessionsByDay(planId, planDayId);

  const renderBody = (): React.ReactNode => {
    if (planDayId === null) {
      return <DayEmpty hasDayType={hasDayType} />;
    }

    if (sessionsQuery.isLoading) {
      return <Skeleton variant="rectangular" height={SESSIONS_SKELETON_HEIGHT_PX} />;
    }

    if (sessionsQuery.error) {
      return <Alert severity="error">Failed to load sessions</Alert>;
    }

    const sessions = sessionsQuery.data?.sessions;

    if (!sessions || sessions.length === 0) {
      return <DayEmpty hasDayType={hasDayType} />;
    }

    return (
      <Stack spacing={2}>
        {sessions.map((session) => (
          <PlanSessionCard key={session.id} planId={planId} session={session} lookups={lookups} />
        ))}
      </Stack>
    );
  };

  return (
    <Stack spacing={1}>
      <DayRowHeader date={date} dayType={dayType} />
      {renderBody()}
    </Stack>
  );
};
