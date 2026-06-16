"use client";

import { Avatar, Box, Checkbox, Stack, Typography } from "@mui/material";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { type AthleteDailySummary, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";
import { RosterRow, StatusChip, TodayStatusLabel } from "@repo/ui";

import { HEALTH_STATUS_CHIPS } from "@app/lib/config";

import { isLastSeenCritical, shortPlan } from "./dashboard-config";

const AVATAR_SIZE = 4;
const DOT = "·";

type TodayRosterRowProps = {
  athlete: AthleteDailySummary;
  isSelecting: boolean;
  isChecked: boolean;
  onToggle: (athleteId: string) => void;
  onOpen: (athleteId: string) => void;
};

const renderSub = (athlete: AthleteDailySummary): React.ReactNode => {
  const showLastSeen =
    athlete.daysSinceLastActivity !== null &&
    athlete.daysSinceLastActivity > 0 &&
    athlete.todayStatus !== TodayStatus.COMPLETED;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <Box component="span" sx={{ fontWeight: 600 }}>
        {shortPlan(athlete.planName)}
      </Box>
      {athlete.todayWorkoutTitle !== null && (
        <>
          <Box component="span">{DOT}</Box>
          <Box component="span">{athlete.todayWorkoutTitle}</Box>
        </>
      )}
      {showLastSeen && athlete.daysSinceLastActivity !== null && (
        <>
          <Box component="span">{DOT}</Box>
          <Box
            component="span"
            sx={{
              color: isLastSeenCritical(athlete.daysSinceLastActivity)
                ? "error.main"
                : "text.secondary",
            }}
          >
            Last seen {athlete.daysSinceLastActivity}d ago
          </Box>
        </>
      )}
    </Stack>
  );
};

export const TodayRosterRow: React.FC<TodayRosterRowProps> = ({
  athlete,
  isSelecting,
  isChecked,
  onToggle,
  onOpen,
}) => {
  const displayName = athlete.name ?? athlete.email;
  const healthChip =
    athlete.healthStatus !== HealthStatus.HEALTHY
      ? HEALTH_STATUS_CHIPS[athlete.healthStatus]
      : null;

  return (
    <RosterRow
      selected={isChecked}
      onClick={() => (isSelecting ? onToggle(athlete.userId) : onOpen(athlete.userId))}
      leading={
        isSelecting ? (
          <Checkbox
            checked={isChecked}
            onClick={(event) => event.stopPropagation()}
            onChange={() => onToggle(athlete.userId)}
            inputProps={{ "aria-label": `Select ${displayName}` }}
          />
        ) : (
          <Avatar
            {...(athlete.image !== null && { src: athlete.image })}
            alt={displayName}
            sx={(theme) => ({
              width: theme.spacing(AVATAR_SIZE),
              height: theme.spacing(AVATAR_SIZE),
            })}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        )
      }
      name={
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography component="span" variant="body1" sx={{ fontWeight: 600 }}>
            {displayName}
          </Typography>
          {healthChip !== null && <StatusChip {...healthChip} />}
        </Stack>
      }
      sub={renderSub(athlete)}
      trailing={<TodayStatusLabel status={athlete.todayStatus} />}
    />
  );
};
