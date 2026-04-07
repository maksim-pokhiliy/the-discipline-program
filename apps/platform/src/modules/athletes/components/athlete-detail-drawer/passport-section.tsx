"use client";

import { Avatar, Stack, Typography } from "@mui/material";

import type { HealthStatus } from "@repo/contracts/athlete-profile";
import type { NextWorkout } from "@repo/contracts/coach-athletes";
import type { ProcessStatus } from "@repo/contracts/coach-dashboard";

import { StatusChip } from "@app/lib/components";
import { HEALTH_STATUS_CHIPS, PROCESS_STATUS_CHIPS } from "@app/lib/config";

import { formatDate } from "./config";

type PassportSectionProps = {
  name: string | null;
  email: string;
  image: string | null;
  healthStatus: HealthStatus;
  processStatus: ProcessStatus;
  daysSinceLastActivity: number | null;
  nextWorkout: NextWorkout | null;
  enrolledSince: Date;
};

const formatLastActivity = (daysSince: number | null): string => {
  if (daysSince === null) {
    return "No workouts yet";
  }

  if (daysSince === 0) {
    return "Today";
  }

  if (daysSince === 1) {
    return "Yesterday";
  }

  return `${daysSince}d ago`;
};

export const PassportSection: React.FC<PassportSectionProps> = ({
  name,
  email,
  image,
  healthStatus,
  processStatus,
  daysSinceLastActivity,
  nextWorkout,
  enrolledSince,
}) => {
  const displayName = name ?? email;

  return (
    <Stack spacing={1.5} sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Avatar src={image ?? undefined} alt={displayName} sx={{ width: 56, height: 56 }} />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Enrolled since {formatDate(enrolledSince, "day")}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
        <StatusChip {...HEALTH_STATUS_CHIPS[healthStatus]} />
        <StatusChip {...PROCESS_STATUS_CHIPS[processStatus]} />
      </Stack>

      <Stack spacing={0.25}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Last workout: {formatLastActivity(daysSinceLastActivity)}
        </Typography>
        {nextWorkout && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Next: {nextWorkout.title} · {formatDate(nextWorkout.date, "weekday")}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};
