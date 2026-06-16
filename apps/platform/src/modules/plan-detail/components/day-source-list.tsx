"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { type DayOfWeek, dayOfWeekValues } from "@repo/contracts/lms/_shared";
import type { DaySlot } from "@repo/contracts/lms/day";

import { formatDayLabel } from "../lib/format-day-label";

const BACK_LABEL = "Back to week list";
const EMPTY_TAG = "Empty — nothing to clone";
const LIST_MAX_HEIGHT_PX = 360;
const SKELETON_ROW_HEIGHT_PX = 44;

const findDay = (days: DaySlot[], dayOfWeek: DayOfWeek): DaySlot | undefined =>
  days.find((day) => day.dayOfWeek === dayOfWeek);

type DaySourceListProps = {
  days: DaySlot[];
  sourceLabel: string;
  isLoading: boolean;
  onPick: (dayOfWeek: DayOfWeek) => void;
  onBack: () => void;
};

export const DaySourceList: React.FC<DaySourceListProps> = ({
  days,
  sourceLabel,
  isLoading,
  onPick,
  onBack,
}) => (
  <Stack spacing={1.5}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Button
        size="small"
        variant="text"
        color="inherit"
        startIcon={<ArrowBackIcon fontSize="small" />}
        aria-label={BACK_LABEL}
        onClick={onBack}
      >
        Back
      </Button>

      <Typography variant="body2" color="text.secondary">
        {sourceLabel}
      </Typography>
    </Stack>

    {isLoading ? (
      <Stack spacing={1}>
        {dayOfWeekValues.map((dayOfWeek) => (
          <Skeleton key={dayOfWeek} variant="rounded" height={SKELETON_ROW_HEIGHT_PX} />
        ))}
      </Stack>
    ) : (
      <List disablePadding sx={{ maxHeight: LIST_MAX_HEIGHT_PX, overflowY: "auto" }}>
        {dayOfWeekValues.map((dayOfWeek) => {
          const day = findDay(days, dayOfWeek);
          const sessionCount = day?.sessions.length ?? 0;
          const isEmpty = sessionCount === 0;
          const primary = `${formatDayLabel(dayOfWeek)} — ${sessionCount} sessions`;

          return (
            <ListItem key={dayOfWeek} disablePadding>
              <ListItemButton disabled={isEmpty} onClick={() => onPick(dayOfWeek)}>
                <ListItemText
                  primary={primary}
                  {...(isEmpty && {
                    secondary: EMPTY_TAG,
                    secondaryTypographyProps: { color: "text.disabled" },
                  })}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    )}
  </Stack>
);
