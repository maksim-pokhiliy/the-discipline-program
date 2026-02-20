"use client";

import { useState } from "react";

import { TrendingDownRounded, TrendingFlatRounded, TrendingUpRounded } from "@mui/icons-material";
import { Card, CardContent, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";

import type { ProgressBuckets } from "@repo/contracts/coach-dashboard";

import { ProgressAthleteRow } from "../components";

type ProgressSectionProps = {
  buckets: ProgressBuckets;
};

const TABS = [
  {
    key: "improving" as const,
    label: "Improving",
    icon: <TrendingUpRounded sx={{ fontSize: 16 }} />,
    color: "success" as const,
  },
  {
    key: "stagnating" as const,
    label: "Stable",
    icon: <TrendingFlatRounded sx={{ fontSize: 16 }} />,
    color: "info" as const,
  },
  {
    key: "declining" as const,
    label: "Declining",
    icon: <TrendingDownRounded sx={{ fontSize: 16 }} />,
    color: "error" as const,
  },
] as const;

export const ProgressSection = ({ buckets }: ProgressSectionProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const currentTab = TABS[activeTab]!;
  const currentAthletes = buckets[currentTab.key];

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Progress & Analytics
          </Typography>
          <Stack direction="row" spacing={2}>
            <Stack spacing={0.25} sx={{ alignItems: "center", flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "info.main" }}>
                {Math.round(buckets.avgCompletionRate * 100)}%
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", textAlign: "center", lineHeight: 1.2 }}
              >
                Avg Completion
              </Typography>
            </Stack>
            <Stack spacing={0.25} sx={{ alignItems: "center", flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "info.main" }}>
                {Math.round(buckets.avgEngagementRate * 100)}%
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", textAlign: "center", lineHeight: 1.2 }}
              >
                Engagement
              </Typography>
            </Stack>
          </Stack>
          <Tabs
            value={activeTab}
            onChange={(_, val: number) => setActiveTab(val)}
            variant="fullWidth"
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                minHeight: 36,
                py: 0.5,
                fontSize: "0.75rem",
                textTransform: "none",
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.key}
                label={
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                    <Chip
                      label={buckets[tab.key].length}
                      size="small"
                      color={tab.color}
                      sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, ml: 0.5 }}
                    />
                  </Stack>
                }
              />
            ))}
          </Tabs>
          <Stack>
            {currentAthletes.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", py: 2, textAlign: "center" }}
              >
                No athletes in this category
              </Typography>
            ) : (
              currentAthletes.map((athlete) => (
                <ProgressAthleteRow key={athlete.userId} athlete={athlete} />
              ))
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
