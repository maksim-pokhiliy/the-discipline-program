"use client";

import BadgeIcon from "@mui/icons-material/Badge";
import ClearIcon from "@mui/icons-material/Clear";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import ViewListIcon from "@mui/icons-material/ViewList";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Tabs,
  TextField,
  ToggleButton,
} from "@mui/material";

import { ChipTab, LabeledToggleGroup } from "@repo/ui";

import { AthletesFilterMenu, type FilterMenuOption } from "../components/athletes-filter-menu";
import type {
  AthleteSegment,
  AthleteSort,
  AthleteView,
} from "../components/athletes-roster-config";
import { AthletesSortMenu } from "../components/athletes-sort-menu";

type AthletesControlsSectionProps = {
  search: string;
  onSearchChange: (value: string) => void;
  segment: AthleteSegment;
  onSegmentChange: (segment: AthleteSegment) => void;
  segmentCounts: Record<AthleteSegment, number>;
  planOptions: FilterMenuOption[];
  selectedPlans: Set<string>;
  onPlansChange: (next: Set<string>) => void;
  healthOptions: FilterMenuOption[];
  selectedHealth: Set<string>;
  onHealthChange: (next: Set<string>) => void;
  view: AthleteView;
  onViewChange: (view: AthleteView) => void;
  sort: AthleteSort;
  onSortChange: (sort: AthleteSort) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export const AthletesControlsSection: React.FC<AthletesControlsSectionProps> = ({
  search,
  onSearchChange,
  segment,
  onSegmentChange,
  segmentCounts,
  planOptions,
  selectedPlans,
  onPlansChange,
  healthOptions,
  selectedHealth,
  onHealthChange,
  view,
  onViewChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}) => (
  <Stack spacing={1.5}>
    <TextField
      size="small"
      fullWidth
      placeholder="Search by name or email…"
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton size="small" aria-label="Clear search" onClick={() => onSearchChange("")}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />

    <Tabs
      value={segment}
      onChange={(_, value: AthleteSegment) => onSegmentChange(value)}
      variant="scrollable"
      scrollButtons="auto"
    >
      <ChipTab value="all" label="All" count={segmentCounts.all} />
      <ChipTab
        value="attention"
        label="Needs attention"
        count={segmentCounts.attention}
        {...(segmentCounts.attention > 0 && { chipColor: "warning" as const })}
      />
      <ChipTab
        value="invited"
        label="Invited"
        count={segmentCounts.invited}
        {...(segmentCounts.invited > 0 && { chipColor: "info" as const })}
      />
    </Tabs>

    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <AthletesFilterMenu
        label="Plan"
        icon={<EventNoteIcon fontSize="small" />}
        options={planOptions}
        selected={selectedPlans}
        onChange={onPlansChange}
      />
      <AthletesFilterMenu
        label="Health"
        icon={<FavoriteIcon fontSize="small" />}
        options={healthOptions}
        selected={selectedHealth}
        onChange={onHealthChange}
      />

      {hasActiveFilters && (
        <Button
          size="small"
          variant="text"
          color="inherit"
          startIcon={<ClearIcon />}
          onClick={onClearFilters}
        >
          Clear
        </Button>
      )}

      <Box sx={{ flex: 1 }} />

      <LabeledToggleGroup<AthleteView>
        label="View"
        value={view}
        onChange={(_, value) => {
          if (value) {
            onViewChange(value);
          }
        }}
      >
        <ToggleButton value="rows" aria-label="Rows">
          <ViewListIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="passport" aria-label="Passport">
          <BadgeIcon fontSize="small" />
        </ToggleButton>
      </LabeledToggleGroup>

      <AthletesSortMenu sort={sort} onSortChange={onSortChange} />
    </Stack>
  </Stack>
);
