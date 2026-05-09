"use client";

import { Alert, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { type DayType } from "@repo/contracts/lms/day-type";
import { LoadingState } from "@repo/ui";

import { useSessionsByDay } from "@app/lib/hooks";

import { DayEmpty } from "./day-empty";
import { DayRowHeader } from "./day-row-header";
import { DayTypeBadge } from "./day-type-badge";
import { EmptyAddCell } from "./empty-add-cell";
import { PlanSessionCard } from "./plan-session-card";
import { type Lookups } from "./types";

const DAY_BG_ALPHA = 0.08;
const DATE_COL_MIN_WIDTH_FACTOR = 10;
const SESSIONS_LOADING_MIN_HEIGHT = "6vh";

type DayRowProps = {
  planId: string;
  date: Date;
  isToday: boolean;
  planDayId: string | null;
  dayType: DayType | null;
  lookups: Lookups;
  onAddDay: (date: Date) => void;
  onAddSession: (dayId: string) => void;
  onAddBlock: (sessionId: string) => void;
  onEditBlock: (sessionId: string, blockId: string) => void;
};

export const DayRow: React.FC<DayRowProps> = ({
  planId,
  date,
  isToday,
  planDayId,
  dayType,
  lookups,
  onAddDay,
  onAddSession,
  onAddBlock,
  onEditBlock,
}) => {
  const hasDayType = dayType !== null;
  const sessionsQuery = useSessionsByDay(planId, planDayId);

  const renderSessions = (): React.ReactNode => {
    if (planDayId === null) {
      return <DayEmpty hasDayType={hasDayType} onAddDay={() => onAddDay(date)} />;
    }

    if (sessionsQuery.isLoading) {
      return <LoadingState message="Loading sessions..." minHeight={SESSIONS_LOADING_MIN_HEIGHT} />;
    }

    if (sessionsQuery.error) {
      return <Alert severity="error">Failed to load sessions</Alert>;
    }

    const sessions = sessionsQuery.data?.sessions;

    if (!sessions || sessions.length === 0) {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <DayEmpty hasDayType={hasDayType} onAddDay={() => onAddDay(date)} />
          <EmptyAddCell label="Add session" onAdd={() => onAddSession(planDayId)} />
        </Stack>
      );
    }

    return (
      <Stack spacing={2}>
        {sessions.map((session) => (
          <PlanSessionCard
            key={session.id}
            planId={planId}
            session={session}
            lookups={lookups}
            onAddBlock={onAddBlock}
            onEditBlock={onEditBlock}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        p: 2,
        bgcolor: dayType !== null ? alpha(dayType.color, DAY_BG_ALPHA) : "transparent",
      }}
    >
      <Stack sx={{ minWidth: (theme) => theme.spacing(DATE_COL_MIN_WIDTH_FACTOR) }}>
        <DayRowHeader date={date} isToday={isToday} />
      </Stack>
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        {dayType !== null ? <DayTypeBadge dayType={dayType} /> : null}
        {renderSessions()}
      </Stack>
    </Stack>
  );
};
