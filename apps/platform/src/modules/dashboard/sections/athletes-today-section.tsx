"use client";

import { useMemo, useState } from "react";

import { Box, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";

import { HealthStatus } from "@repo/contracts/athlete-profile";
import { type AthleteDailySummary, TodayStatus } from "@repo/contracts/coach-dashboard";

import { HEALTH_STATUS_CHIPS } from "@app/lib/config";

import { AthleteCard, DashboardSection } from "../components";

import {
  STATUS_GROUPS,
  buildDetails,
  buildMessage,
  getDefaultTab,
  sortAthletes,
} from "./athletes-today-config";

type AthletesTodaySectionProps = {
  athletes: AthleteDailySummary[];
};

export const AthletesTodaySection: React.FC<AthletesTodaySectionProps> = ({ athletes }) => {
  const grouped = useMemo(() => {
    const buckets = new Map<TodayStatus, AthleteDailySummary[]>();

    for (const status of Object.values(TodayStatus)) {
      buckets.set(status, []);
    }

    for (const athlete of athletes) {
      buckets.get(athlete.todayStatus)?.push(athlete);
    }

    return buckets;
  }, [athletes]);

  const [activeTab, setActiveTab] = useState<TodayStatus>(() => getDefaultTab(grouped));

  if (athletes.length === 0) {
    return (
      <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
        No athletes enrolled
      </Typography>
    );
  }

  const activeAthletes = sortAthletes(grouped.get(activeTab) ?? [], activeTab);
  const activeConfig = STATUS_GROUPS.find((g) => g.status === activeTab);

  return (
    <DashboardSection title="Athletes Today">
      <Stack spacing={2}>
        <Tabs
          value={activeTab}
          onChange={(_, value: TodayStatus) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {STATUS_GROUPS.map((group) => {
            const count = grouped.get(group.status)?.length ?? 0;

            return (
              <Tab
                key={group.status}
                value={group.status}
                label={
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" component="span">
                      {group.title}
                    </Typography>
                    <Chip size="small" label={count} color={group.chipColor} />
                  </Stack>
                }
              />
            );
          })}
        </Tabs>

        {activeAthletes.length > 0 ? (
          <Stack spacing={2}>
            {activeAthletes.map((athlete) => {
              const chips =
                athlete.healthStatus !== HealthStatus.HEALTHY
                  ? [HEALTH_STATUS_CHIPS[athlete.healthStatus]]
                  : undefined;

              return (
                <Box
                  key={athlete.userId}
                  component={Link}
                  href={`/coach/athletes?athlete=${athlete.userId}`}
                  sx={(theme) => ({
                    textDecoration: "none",
                    borderRadius: 1,
                    transition: theme.transitions.create("opacity"),
                    "&:hover": { opacity: 0.85 },
                  })}
                >
                  <AthleteCard
                    name={athlete.name ?? athlete.email}
                    image={athlete.image}
                    severity={activeConfig?.severity ?? "info"}
                    message={buildMessage(athlete)}
                    chips={chips}
                    details={buildDetails(athlete)}
                  />
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
            {activeConfig?.emptyMessage}
          </Typography>
        )}
      </Stack>
    </DashboardSection>
  );
};
