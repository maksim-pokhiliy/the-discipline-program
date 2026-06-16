"use client";

import { Box, Card, Checkbox, Grid, Stack, Typography } from "@mui/material";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { EmptyState } from "@repo/ui";

import { AthletePassportCard } from "../components/athlete-passport-card";
import { AthleteRosterRow } from "../components/athlete-roster-row";
import { type AthleteRowAction } from "../components/athlete-row-actions-menu";
import type { AthleteSegment, AthleteView } from "../components/athletes-roster-config";

type SelectAllState = "none" | "some" | "all";

type AthletesRosterSectionProps = {
  athletes: CoachAthleteListItem[];
  view: AthleteView;
  segment: AthleteSegment;
  selected: Set<string>;
  selectAllState: SelectAllState;
  onToggleSelect: (userId: string) => void;
  onToggleSelectAll: () => void;
  onOpen: (userId: string) => void;
  onAction: (athlete: CoachAthleteListItem, action: AthleteRowAction) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export const AthletesRosterSection: React.FC<AthletesRosterSectionProps> = ({
  athletes,
  view,
  segment,
  selected,
  selectAllState,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onAction,
  hasActiveFilters,
  onClearFilters,
}) => {
  if (athletes.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          message="No athletes match your filters."
          action={{ label: "Clear filters", onClick: onClearFilters }}
        />
      );
    }

    if (segment === "invited") {
      return <EmptyState message="No pending invites." />;
    }

    return <EmptyState message="No athletes in this view." />;
  }

  if (view === "passport") {
    return (
      <Grid container spacing={2}>
        {athletes.map((athlete) => (
          <Grid key={athlete.userId} size={{ xs: 12, sm: 6, lg: 4 }}>
            <AthletePassportCard
              athlete={athlete}
              checked={selected.has(athlete.userId)}
              onToggleSelect={() => onToggleSelect(athlete.userId)}
              onOpen={() => onOpen(athlete.userId)}
              onAction={(action) => onAction(athlete, action)}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  const selectedVisible = athletes.filter((athlete) => selected.has(athlete.userId)).length;

  return (
    <Card variant="outlined">
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={(theme) => ({ px: 1.5, py: 1, borderBottom: `1px solid ${theme.palette.divider}` })}
      >
        <Checkbox
          size="small"
          checked={selectAllState === "all"}
          indeterminate={selectAllState === "some"}
          onChange={onToggleSelectAll}
        />
        <Typography variant="caption" color="text.secondary">
          {selectedVisible > 0 ? `${selectedVisible} selected` : "Select all"}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {athletes.length === 1 ? "1 athlete" : `${athletes.length} athletes`}
        </Typography>
      </Stack>

      <Box>
        {athletes.map((athlete, index) => (
          <Box
            key={athlete.userId}
            sx={(theme) => (index > 0 ? { borderTop: `1px solid ${theme.palette.divider}` } : {})}
          >
            <AthleteRosterRow
              athlete={athlete}
              checked={selected.has(athlete.userId)}
              onToggleSelect={() => onToggleSelect(athlete.userId)}
              onOpen={() => onOpen(athlete.userId)}
              onAction={(action) => onAction(athlete, action)}
            />
          </Box>
        ))}
      </Box>
    </Card>
  );
};
