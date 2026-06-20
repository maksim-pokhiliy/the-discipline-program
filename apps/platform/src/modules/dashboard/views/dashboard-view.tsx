"use client";

import { useState } from "react";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { IconButton, Stack } from "@mui/material";

import { useSession } from "@repo/auth/client";
import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";
import { formatDate } from "@repo/shared";
import { PlatformPageHeader, QueryWrapper } from "@repo/ui";

import { useCoachDashboard, useResolveActionItem } from "@app/lib/hooks";
import { AthleteDetailDrawer } from "@app/modules/athletes";

import { DashboardEmptyState, ResolveActionItemModal } from "../components";
import {
  DashboardFooterLine,
  FallingBehindSection,
  NeedsAttentionSection,
  PulseBandSection,
  TodayRosterSection,
} from "../sections";

const REFRESH_BUTTON_PX = 40;

export const DashboardView = () => {
  const { data, isLoading, error, refetch } = useCoachDashboard();
  const { data: session } = useSession();
  const resolveMutation = useResolveActionItem();

  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [todayVisibleIds, setTodayVisibleIds] = useState<string[]>([]);
  const [resolveItem, setResolveItem] = useState<DashboardActionItem | null>(null);

  const coachName = session?.user?.name ?? null;
  const todayLabel = formatDate(new Date(), "weekday");

  return (
    <>
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={data}
        loadingMessage="Loading dashboard..."
      >
        {(data) =>
          data.overview.totalActiveAthletes === 0 ? (
            <DashboardEmptyState coachName={coachName} />
          ) : (
            <Stack spacing={{ xs: 2, md: 3 }}>
              <PlatformPageHeader
                eyebrow={todayLabel}
                title="Dashboard"
                actions={
                  <IconButton
                    onClick={() => refetch()}
                    aria-label="Refresh dashboard"
                    sx={{ width: REFRESH_BUTTON_PX, height: REFRESH_BUTTON_PX }}
                  >
                    <RefreshRoundedIcon />
                  </IconButton>
                }
              />

              <PulseBandSection
                actionItems={data.actionItems}
                athletes={data.athletesSummary}
                totalActiveAthletes={data.overview.totalActiveAthletes}
              />

              <NeedsAttentionSection
                items={data.actionItems}
                onOpenAthlete={setSelectedAthleteId}
                onOpenResolve={setResolveItem}
                onQuickResolve={(itemId) => resolveMutation.mutate({ itemId })}
              />

              <TodayRosterSection
                athletes={data.athletesSummary}
                onOpenAthlete={setSelectedAthleteId}
                onVisibleIdsChange={setTodayVisibleIds}
              />

              <FallingBehindSection
                buckets={data.progressBuckets}
                onOpenAthlete={setSelectedAthleteId}
              />

              <DashboardFooterLine
                overview={data.overview}
                avgEngagementRate={data.progressBuckets.avgEngagementRate}
              />
            </Stack>
          )
        }
      </QueryWrapper>

      <AthleteDetailDrawer
        athleteId={selectedAthleteId}
        visibleIds={todayVisibleIds}
        onClose={() => setSelectedAthleteId(null)}
        onNavigate={setSelectedAthleteId}
      />

      <ResolveActionItemModal
        open={resolveItem !== null}
        item={resolveItem}
        onClose={() => setResolveItem(null)}
      />
    </>
  );
};
