"use client";

import { useMemo, useState } from "react";

import { Box, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";

import {
  PROCESS_STATUS_LABELS,
  type ProgressBuckets,
  ProcessStatus,
} from "@repo/contracts/coach-dashboard";
import { rateToPercent } from "@repo/shared";

import { AthleteCard, DashboardSection } from "../components";

import { PROGRESS_GROUPS, getDefaultProgressTab } from "./progress-buckets-config";

type ProgressBucketsSectionProps = {
  buckets: ProgressBuckets;
};

const STATUS_TO_BUCKET_KEY: Record<
  ProcessStatus,
  keyof Omit<ProgressBuckets, "avgEngagementRate">
> = {
  [ProcessStatus.ON_TRACK]: "onTrack",
  [ProcessStatus.STEADY]: "steady",
  [ProcessStatus.FALLING_BEHIND]: "fallingBehind",
};

export const ProgressBucketsSection: React.FC<ProgressBucketsSectionProps> = ({ buckets }) => {
  const counts = useMemo(
    () =>
      new Map<ProcessStatus, number>([
        [ProcessStatus.ON_TRACK, buckets.onTrack.length],
        [ProcessStatus.STEADY, buckets.steady.length],
        [ProcessStatus.FALLING_BEHIND, buckets.fallingBehind.length],
      ]),
    [buckets],
  );

  const totalAthletes =
    buckets.onTrack.length + buckets.steady.length + buckets.fallingBehind.length;

  const [activeTab, setActiveTab] = useState<ProcessStatus>(() => getDefaultProgressTab(counts));

  if (totalAthletes === 0) {
    return null;
  }

  const bucketKey = STATUS_TO_BUCKET_KEY[activeTab];
  const athletes = buckets[bucketKey];
  const activeConfig = PROGRESS_GROUPS.find((g) => g.status === activeTab);

  return (
    <DashboardSection
      title="Progress"
      badge={{
        label: `${rateToPercent(buckets.avgEngagementRate)}% engaged`,
        color: "info",
      }}
    >
      <Stack spacing={2}>
        <Tabs
          value={activeTab}
          onChange={(_, value: ProcessStatus) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {PROGRESS_GROUPS.map((group) => {
            const count = counts.get(group.status) ?? 0;

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

        {athletes.length > 0 ? (
          <Stack spacing={2}>
            {athletes.map((athlete) => (
              <Box
                key={athlete.userId}
                component={Link}
                href={athlete.href}
                sx={(theme) => ({
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
                  message={PROCESS_STATUS_LABELS[athlete.processStatus]}
                />
              </Box>
            ))}
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
