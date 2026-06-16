"use client";

import { useRef, useState } from "react";

import { Box, Stack } from "@mui/material";

import { useSession } from "@repo/auth/client";
import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";
import { QueryWrapper } from "@repo/ui";

import { useCoachDashboard, useResolveActionItem } from "@app/lib/hooks";
import { AthleteDetailDrawer } from "@app/modules/athletes";

import { DashboardEmptyState, DashboardHeaderBand, ResolveActionItemModal } from "../components";
import {
  DashboardFooterLine,
  FallingBehindSection,
  NeedsAttentionSection,
  PulseBandSection,
  TodayRosterSection,
} from "../sections";

export const DashboardView = () => {
  const { data, isLoading, error } = useCoachDashboard();
  const { data: session } = useSession();
  const resolveMutation = useResolveActionItem();

  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [todayVisibleIds, setTodayVisibleIds] = useState<string[]>([]);
  const [resolveItem, setResolveItem] = useState<DashboardActionItem | null>(null);
  const attentionRef = useRef<HTMLDivElement>(null);

  const coachName = session?.user?.name ?? null;

  const scrollToAttention = (): void =>
    attentionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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
              <DashboardHeaderBand
                coachName={coachName}
                needAttentionCount={data.actionItems.length}
                onScrollToAttention={scrollToAttention}
              />

              <PulseBandSection
                actionItems={data.actionItems}
                athletes={data.athletesSummary}
                totalActiveAthletes={data.overview.totalActiveAthletes}
              />

              <Box ref={attentionRef}>
                <NeedsAttentionSection
                  items={data.actionItems}
                  onOpenAthlete={setSelectedAthleteId}
                  onOpenResolve={setResolveItem}
                  onQuickResolve={(itemId) => resolveMutation.mutate({ itemId })}
                />
              </Box>

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
