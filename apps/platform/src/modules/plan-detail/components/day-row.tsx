"use client";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { Alert, Box, IconButton, Stack, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { type DayType } from "@repo/contracts/lms/day-type";
import { LoadingState } from "@repo/ui";

import { useAddEmptySessionToDay, useSessionsByDay } from "@app/lib/hooks";

import { DayLabel } from "./day-label";
import { DayRowHeader } from "./day-row-header";
import { PlanSessionCard } from "./plan-session-card";
import { type Lookups } from "./types";

const DAY_BG_ALPHA = 0.08;
const DATE_COL_MIN_WIDTH_FACTOR = 10;
const SESSIONS_LOADING_MIN_HEIGHT = "6vh";
const ROW_ACTION_CLASS = "DayRowAction";
const ROW_ACTION_TRANSITION = "opacity 0.15s ease";

const rowActionSx = {
  opacity: 0,
  transition: ROW_ACTION_TRANSITION,
  "&:focus-visible": { opacity: 1 },
} as const;

type DayRowProps = {
  planId: string;
  date: Date;
  isToday: boolean;
  planDayId: string | null;
  dayType: DayType | null;
  lookups: Lookups;
  onEditDay: (date: Date, dayId: string | null) => void;
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
  onEditDay,
  onAddBlock,
  onEditBlock,
}) => {
  const sessionsQuery = useSessionsByDay(planId, planDayId);
  const addEmptySession = useAddEmptySessionToDay(planId);

  const sessions = sessionsQuery.data?.sessions;
  const sessionsLoading = planDayId !== null && sessionsQuery.isLoading;
  const sessionsError = planDayId !== null && sessionsQuery.error !== null;

  const handleEdit = (): void => onEditDay(date, planDayId);

  const handleAddSession = (): void => {
    addEmptySession.mutate({
      date,
      dayId: planDayId,
      order: sessions?.length ?? 0,
    });
  };

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        p: 2,
        bgcolor: dayType !== null ? alpha(dayType.color, DAY_BG_ALPHA) : "transparent",
        [`&:hover .${ROW_ACTION_CLASS}`]: { opacity: 1 },
      }}
    >
      <Stack sx={{ minWidth: (theme) => theme.spacing(DATE_COL_MIN_WIDTH_FACTOR) }}>
        <DayRowHeader date={date} isToday={isToday} />
      </Stack>
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <DayLabel dayType={dayType} />
          <Tooltip title="Edit day">
            <IconButton
              className={ROW_ACTION_CLASS}
              size="small"
              aria-label="Edit day"
              onClick={handleEdit}
              sx={rowActionSx}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Add session">
            <IconButton
              className={ROW_ACTION_CLASS}
              size="small"
              aria-label="Add session"
              onClick={handleAddSession}
              disabled={addEmptySession.isPending}
              sx={{ ...rowActionSx, color: "primary.main" }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        {sessionsLoading && (
          <LoadingState message="Loading sessions..." minHeight={SESSIONS_LOADING_MIN_HEIGHT} />
        )}
        {sessionsError && <Alert severity="error">Failed to load sessions</Alert>}
        {sessions !== undefined && sessions.length > 0 && (
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
        )}
      </Stack>
    </Stack>
  );
};
