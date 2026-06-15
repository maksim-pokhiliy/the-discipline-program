"use client";

import { Chip, List, ListItem, ListItemButton, ListItemText, Skeleton, Stack } from "@mui/material";

import type { PopulatedWeek } from "@repo/contracts/lms/week";
import { EmptyState } from "@repo/ui";

import { formatWeekLabel } from "../lib/format-week-label";

const EMPTY_MESSAGE = "No other weeks with content yet — build a week first, then clone it.";
const PREVIOUS_WEEK_HINT = "Previous week";
const SKELETON_ROW_COUNT = 3;
const LIST_MAX_HEIGHT_PX = 360;
const SKELETON_ROW_HEIGHT_PX = 44;

const formatWeekSummary = (week: PopulatedWeek): string =>
  `${week.sessionCount} sessions · ${week.dayCount} days`;

type WeekSourceListProps = {
  weeks: PopulatedWeek[];
  isLoading: boolean;
  onPick: (startDate: string) => void;
};

export const WeekSourceList: React.FC<WeekSourceListProps> = ({ weeks, isLoading, onPick }) => {
  if (isLoading) {
    return (
      <Stack spacing={1}>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={SKELETON_ROW_HEIGHT_PX} />
        ))}
      </Stack>
    );
  }

  if (weeks.length === 0) {
    return <EmptyState message={EMPTY_MESSAGE} />;
  }

  return (
    <List disablePadding sx={{ maxHeight: LIST_MAX_HEIGHT_PX, overflowY: "auto" }}>
      {weeks.map((week, index) => (
        <ListItem
          key={week.startDate}
          disablePadding
          secondaryAction={
            index === 0 ? (
              <Chip size="small" variant="outlined" color="primary" label={PREVIOUS_WEEK_HINT} />
            ) : null
          }
        >
          <ListItemButton onClick={() => onPick(week.startDate)}>
            <ListItemText
              primary={formatWeekLabel(week.startDate)}
              secondary={formatWeekSummary(week)}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};
