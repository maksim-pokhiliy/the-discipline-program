"use client";

import { useMemo, useState } from "react";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Stack } from "@mui/material";
import { toast } from "sonner";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { EmptyState } from "@repo/ui";

import {
  type AthleteRowAction,
  type AthleteSegment,
  type AthleteSort,
  type AthleteView,
  type FilterMenuOption,
  AthleteDetailDrawer,
  athleteNeedsAttention,
  extractPlanOptions,
  filterAthletes,
  sortAthletes,
} from "../components";
import {
  type AthleteBatchAction,
  AthletesAttentionStrip,
  AthletesBatchBar,
  AthletesControlsSection,
  AthletesRosterSection,
} from "../sections";

const HEALTH_FILTER_VALUES = [HealthStatus.INJURED, HealthStatus.RESTRICTED, HealthStatus.HEALTHY];

const ROW_ACTION_LABELS: Record<Exclude<AthleteRowAction, "open">, string> = {
  message: "Telegram messaging",
  movePlan: "Move to plan",
  pause: "Pause enrollment",
  resume: "Resume enrollment",
  note: "Coach notes",
  remove: "Remove from plan",
};

const BATCH_ACTION_LABELS: Record<AthleteBatchAction, string> = {
  message: "Telegram messaging",
  movePlan: "Move to plan",
  pause: "Pause enrollments",
  resume: "Resume enrollments",
  note: "Coach notes",
  remove: "Remove from plan",
};

type AthletesRosterProps = {
  athletes: CoachAthleteListItem[];
  onOpenAthlete: (userId: string) => void;
  onInvite: () => void;
  selectedAthleteId: string | null;
  onCloseDrawer: () => void;
};

export const AthletesRoster: React.FC<AthletesRosterProps> = ({
  athletes,
  onOpenAthlete,
  onInvite,
  selectedAthleteId,
  onCloseDrawer,
}) => {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<AthleteSegment>("all");
  const [planFilter, setPlanFilter] = useState<Set<string>>(new Set());
  const [healthFilter, setHealthFilter] = useState<Set<string>>(new Set());
  const [view, setView] = useState<AthleteView>("rows");
  const [sort, setSort] = useState<AthleteSort>("lastName");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const activeAthletes = useMemo(
    () => athletes.filter((athlete) => !athlete.isPending),
    [athletes],
  );

  const planOptions = useMemo<FilterMenuOption[]>(
    () =>
      extractPlanOptions(athletes).map((plan) => ({
        value: plan.id,
        label: plan.name,
        count: plan.count,
      })),
    [athletes],
  );

  const healthOptions = useMemo<FilterMenuOption[]>(
    () =>
      HEALTH_FILTER_VALUES.map((status) => ({
        value: status,
        label: HEALTH_STATUS_LABELS[status],
        count: activeAthletes.filter((athlete) => athlete.healthStatus === status).length,
      })),
    [activeAthletes],
  );

  const segmentCounts = useMemo<Record<AthleteSegment, number>>(
    () => ({
      all: activeAthletes.length,
      attention: activeAthletes.filter(athleteNeedsAttention).length,
      invited: athletes.length - activeAthletes.length,
    }),
    [activeAthletes, athletes],
  );

  const visible = useMemo(
    () =>
      sortAthletes(
        filterAthletes(athletes, {
          search,
          segment,
          planIds: planFilter,
          healthStatuses: healthFilter,
        }),
        sort,
      ),
    [athletes, search, segment, planFilter, healthFilter, sort],
  );

  const selectedVisibleCount = visible.reduce(
    (count, athlete) => count + (selected.has(athlete.userId) ? 1 : 0),
    0,
  );

  const selectAllState =
    selectedVisibleCount === 0 ? "none" : selectedVisibleCount === visible.length ? "all" : "some";

  const hasActiveFilters = search.trim() !== "" || planFilter.size > 0 || healthFilter.size > 0;

  const toggleSelect = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });

  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);

      if (selectAllState === "all") {
        visible.forEach((athlete) => next.delete(athlete.userId));
      } else {
        visible.forEach((athlete) => next.add(athlete.userId));
      }

      return next;
    });

  const clearFilters = () => {
    setSearch("");
    setPlanFilter(new Set());
    setHealthFilter(new Set());
  };

  const handleRowAction = (athlete: CoachAthleteListItem, action: AthleteRowAction) => {
    if (action === "open") {
      onOpenAthlete(athlete.userId);

      return;
    }

    const name = athlete.name ?? athlete.email;

    toast.info(`${ROW_ACTION_LABELS[action]} for ${name} — coming soon`);
  };

  const handleBatchAction = (action: AthleteBatchAction) => {
    toast.info(`${BATCH_ACTION_LABELS[action]} for ${selected.size} athletes — coming soon`);
  };

  if (athletes.length === 0) {
    return (
      <EmptyState
        message="No athletes yet. Invite your first athlete to get them onto a plan."
        action={{ label: "Invite athlete", icon: <PersonAddIcon />, onClick: onInvite }}
      />
    );
  }

  return (
    <>
      <Stack spacing={2}>
        <AthletesAttentionStrip
          athletes={activeAthletes}
          onReview={() => setSegment("attention")}
          onOpenAthlete={onOpenAthlete}
        />

        <AthletesControlsSection
          search={search}
          onSearchChange={setSearch}
          segment={segment}
          onSegmentChange={setSegment}
          segmentCounts={segmentCounts}
          planOptions={planOptions}
          selectedPlans={planFilter}
          onPlansChange={setPlanFilter}
          healthOptions={healthOptions}
          selectedHealth={healthFilter}
          onHealthChange={setHealthFilter}
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={setSort}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        <AthletesRosterSection
          athletes={visible}
          view={view}
          segment={segment}
          selected={selected}
          selectAllState={selectAllState}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onOpen={onOpenAthlete}
          onAction={handleRowAction}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {selected.size > 0 && (
          <AthletesBatchBar
            count={selected.size}
            onAction={handleBatchAction}
            onCancel={() => setSelected(new Set())}
          />
        )}
      </Stack>

      <AthleteDetailDrawer
        athleteId={selectedAthleteId}
        visibleIds={visible.map((athlete) => athlete.userId)}
        onClose={onCloseDrawer}
        onNavigate={onOpenAthlete}
      />
    </>
  );
};
