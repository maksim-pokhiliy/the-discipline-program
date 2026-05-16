"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { Label } from "@repo/contracts/lms/label";
import { formatDayName, isSameDay } from "@repo/shared";

import { useUpdateDayLabel, useUpdateDayNotes } from "@app/lib/hooks";

import { DayLabelSelect } from "./day-label-select";
import { DayNotesField } from "./day-notes-field";

type DayRowProps = {
  date: Date;
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  label: Label | null;
  notes: string | null;
  labelOptions: Label[];
  labelOptionsLoading: boolean;
};

export const DayRow: React.FC<DayRowProps> = ({
  date,
  planId,
  startDate,
  dayOfWeek,
  label,
  notes,
  labelOptions,
  labelOptionsLoading,
}) => {
  const updateLabel = useUpdateDayLabel(planId, startDate, dayOfWeek);
  const updateNotes = useUpdateDayNotes(planId, startDate, dayOfWeek);
  const isToday = isSameDay(date, new Date());
  const dayOfMonth = date.getDate();

  return (
    <Stack direction="column" spacing={1.5} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: 72, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          {formatDayName(date)}
        </Typography>
        {isToday ? (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="subtitle2">{dayOfMonth}</Typography>
          </Box>
        ) : (
          <Typography variant="subtitle2">{dayOfMonth}</Typography>
        )}
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "flex-start" }}
      >
        <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
          <DayLabelSelect
            value={label}
            options={labelOptions}
            isLoading={labelOptionsLoading}
            onChange={(labelId) => updateLabel.mutate({ labelId })}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <DayNotesField value={notes} onCommit={(next) => updateNotes.mutate({ notes: next })} />
        </Box>
      </Stack>

      <Typography variant="body2" sx={{ color: "text.disabled" }}>
        No sessions
      </Typography>
    </Stack>
  );
};
