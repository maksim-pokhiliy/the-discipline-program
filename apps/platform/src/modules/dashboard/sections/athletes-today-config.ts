import type { AlertColor, ChipProps } from "@mui/material";

import type { AthleteDailySummary } from "@repo/contracts/coaching/coach-dashboard";
import { TodayStatus } from "@repo/contracts/coaching/coach-dashboard";

export type StatusGroupConfig = {
  status: TodayStatus;
  title: string;
  chipColor: ChipProps["color"];
  severity: AlertColor;
  emptyMessage: string;
};

export const STATUS_GROUPS: StatusGroupConfig[] = [
  {
    status: TodayStatus.MISSED,
    title: "Missed",
    chipColor: "error",
    severity: "info",
    emptyMessage: "Nobody missed — coach life is good",
  },
  {
    status: TodayStatus.PENDING,
    title: "Pending",
    chipColor: "warning",
    severity: "info",
    emptyMessage: "All done for today — or nobody planned",
  },
  {
    status: TodayStatus.COMPLETED,
    title: "Completed",
    chipColor: "success",
    severity: "success",
    emptyMessage: "No completions yet — the day is young",
  },
  {
    status: TodayStatus.REST_DAY,
    title: "Rest Day",
    chipColor: "default",
    severity: "info",
    emptyMessage: "Everyone's grinding today — no rest days",
  },
  {
    status: TodayStatus.NO_SCHEDULE,
    title: "No Schedule",
    chipColor: "default",
    severity: "info",
    emptyMessage: "All athletes have scheduled workouts",
  },
];

export const sortAthletes = (athletes: AthleteDailySummary[], status: TodayStatus) => {
  if (status === TodayStatus.MISSED) {
    return [...athletes].sort((a, b) => b.missedCount - a.missedCount);
  }

  return [...athletes].sort((a, b) => {
    const nameA = a.name ?? a.email;
    const nameB = b.name ?? b.email;

    return nameA.localeCompare(nameB);
  });
};

export const getDefaultTab = (grouped: Map<TodayStatus, AthleteDailySummary[]>) => {
  for (const group of STATUS_GROUPS) {
    const athletes = grouped.get(group.status);

    if (athletes && athletes.length > 0) {
      return group.status;
    }
  }

  return TodayStatus.MISSED;
};

export const buildMessage = (athlete: AthleteDailySummary): string => {
  switch (athlete.todayStatus) {
    case TodayStatus.MISSED:
      return `${athlete.missedCount} missed this week`;
    case TodayStatus.PENDING:
      return athlete.todayWorkoutTitle ?? "Workout pending";
    case TodayStatus.COMPLETED:
      return "Completed today";
    case TodayStatus.REST_DAY:
      return "Rest day";
    case TodayStatus.NO_SCHEDULE:
      return "No scheduled workouts";
  }
};

export const buildDetails = (athlete: AthleteDailySummary): string | undefined => {
  const parts: string[] = [];

  if (athlete.planName) {
    parts.push(athlete.planName);
  }

  if (athlete.daysSinceLastActivity !== null && athlete.daysSinceLastActivity > 0) {
    parts.push(`last active ${athlete.daysSinceLastActivity}d ago`);
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
};
