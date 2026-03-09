"use client";

import { useMemo, useState } from "react";

import { Box, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";

import { type ProgressBuckets, ProgressTrend } from "@repo/contracts/coach-dashboard";

import { AthleteCard, DashboardSection } from "../components";

import {
  PROGRESS_GROUPS,
  formatCompletionRate,
  getDefaultProgressTab,
} from "./progress-buckets-config";

type ProgressBucketsSectionProps = {
  buckets: ProgressBuckets;
};

const TREND_TO_BUCKET_KEY: Record<ProgressTrend, keyof Omit<ProgressBuckets, "avgEngagementRate">> =
  {
    [ProgressTrend.UP]: "improving",
    [ProgressTrend.STABLE]: "stagnating",
    [ProgressTrend.DOWN]: "declining",
  };

export const ProgressBucketsSection: React.FC<ProgressBucketsSectionProps> = ({ buckets }) => {
  const counts = useMemo(
    () =>
      new Map<ProgressTrend, number>([
        [ProgressTrend.UP, buckets.improving.length],
        [ProgressTrend.STABLE, buckets.stagnating.length],
        [ProgressTrend.DOWN, buckets.declining.length],
      ]),
    [buckets],
  );

  const totalAthletes =
    buckets.improving.length + buckets.stagnating.length + buckets.declining.length;

  const [activeTab, setActiveTab] = useState<ProgressTrend>(() => getDefaultProgressTab(counts));

  if (totalAthletes === 0) {
    return null;
  }

  const bucketKey = TREND_TO_BUCKET_KEY[activeTab];
  const athletes = buckets[bucketKey];
  const activeConfig = PROGRESS_GROUPS.find((g) => g.trend === activeTab);

  return (
    <DashboardSection
      title="Progress"
      badge={{
        label: `${Math.round(buckets.avgEngagementRate * 100)}% engaged`,
        color: "info",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, value: ProgressTrend) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {PROGRESS_GROUPS.map((group) => {
          const count = counts.get(group.trend) ?? 0;

          return (
            <Tab
              key={group.trend}
              value={group.trend}
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

      {athletes.length > 0 ? (
        <Stack spacing={2}>
          {athletes.map((athlete) => (
            <Box
              key={athlete.userId}
              component={Link}
              href={athlete.href}
              sx={(theme) => ({
                display: "block",
                textDecoration: "none",
                borderRadius: 1,
                transition: theme.transitions.create("opacity"),
                "&:hover": { opacity: 0.85 },
              })}
            >
              <AthleteCard
                name={athlete.name ?? "Unknown"}
                image={athlete.image}
                severity={activeConfig?.severity ?? "info"}
                message={formatCompletionRate(athlete.completionRate)}
              />
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
          {activeConfig?.emptyMessage}
        </Typography>
      )}
    </DashboardSection>
  );
};
