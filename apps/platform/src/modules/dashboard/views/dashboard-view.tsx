"use client";

import { Container, Stack } from "@mui/material";

import type { CoachDashboardData } from "@repo/contracts/coach-dashboard";
import { QueryWrapper } from "@repo/query";

import { useCoachDashboard } from "@app/lib/hooks";

import {
  AthletesTodaySection,
  AttentionSection,
  EndingPlansSection,
  LoadSection,
  NotesSection,
  OnboardingSection,
  OverviewSection,
  ProgressSection,
  QuickActionsSection,
} from "../sections";

type DashboardViewProps = {
  initialData: CoachDashboardData;
};

export const DashboardView = ({ initialData }: DashboardViewProps) => {
  const { data, isLoading, error } = useCoachDashboard(initialData);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading dashboard..."
    >
      {(dashboard) => (
        <Container maxWidth="sm" disableGutters sx={{ px: 2, py: 2, pb: 10 }}>
          <Stack spacing={3}>
            <OverviewSection overview={dashboard.overview} />
            <AttentionSection alerts={dashboard.attentionAlerts} />
            <AthletesTodaySection athletes={dashboard.athletesSummary} />
            <QuickActionsSection />
            <LoadSection items={dashboard.loadDistributionToday} />
            <ProgressSection buckets={dashboard.progressBuckets} />
            <NotesSection notes={dashboard.recentNotes} />
            <OnboardingSection athletes={dashboard.onboarding} />
            <EndingPlansSection plans={dashboard.endingPlans} />
          </Stack>
        </Container>
      )}
    </QueryWrapper>
  );
};
