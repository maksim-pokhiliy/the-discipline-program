"use client";

import { useMemo } from "react";

import { Grid, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";

import {
  type AthleteFilters,
  AthleteListItem,
  filterAthletes,
  sortByAttentionPriority,
} from "../components";

type AthletesListSectionProps = {
  athletes: CoachAthleteListItem[];
  onSelectAthlete: (userId: string) => void;
};

const HEALTH_STATUS_VALUES: Set<string> = new Set(Object.values(HealthStatus));

const isHealthStatus = (value: string): value is HealthStatus => HEALTH_STATUS_VALUES.has(value);

const parseHealthStatus = (value: string | null): HealthStatus | null => {
  if (value && isHealthStatus(value)) {
    return value;
  }

  return null;
};

export const AthletesListSection: React.FC<AthletesListSectionProps> = ({
  athletes,
  onSelectAthlete,
}) => {
  const searchParams = useSearchParams();

  const filters: AthleteFilters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      healthStatus: parseHealthStatus(searchParams.get("healthStatus")),
      planId: searchParams.get("planId") ?? null,
      needsAttention: searchParams.get("needsAttention") === "true",
    }),
    [searchParams],
  );

  const displayedAthletes = useMemo(
    () => sortByAttentionPriority(filterAthletes(athletes, filters)),
    [athletes, filters],
  );

  if (athletes.length === 0) {
    return (
      <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
        No athletes yet — ask an admin to assign athletes to you
      </Typography>
    );
  }

  if (displayedAthletes.length === 0) {
    return (
      <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
        No athletes match your filters
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {displayedAthletes.map((athlete) => (
        <Grid key={athlete.userId} size={{ xs: 12, md: 6 }}>
          <AthleteListItem athlete={athlete} onSelect={onSelectAthlete} />
        </Grid>
      ))}
    </Grid>
  );
};
