"use client";

import { useState } from "react";

import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { alpha, Box, IconButton, Stack } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import { DAY_CONSTANTS, type SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";
import { isSameDay } from "@repo/shared";
import { InlineEditText, LabelPickerChip } from "@repo/ui";

import { useLabelOptions, useUpdateDayLabel, useUpdateDayNotes } from "@app/lib/hooks";

import { DayRowEmpty } from "./day-row-empty";
import { DayRowHead } from "./day-row-head";
import { DayRowRest } from "./day-row-rest";
import { DayRowSummary } from "./day-row-summary";
import { SessionList } from "./session-list";

const DAY_HEAD_WIDTH_PX = 96;
const TODAY_BG_ALPHA = 0.025;

type DayRowProps = {
  date: Date;
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  label: Label | null;
  notes: string | null;
  sessions: SessionWithLabel[];
};

export const DayRow: React.FC<DayRowProps> = ({
  date,
  planId,
  startDate,
  dayOfWeek,
  label,
  notes,
  sessions,
}) => {
  const updateLabel = useUpdateDayLabel(planId, startDate, dayOfWeek);
  const updateNotes = useUpdateDayNotes(planId, startDate, dayOfWeek);
  const dayOptions = useLabelOptions("DAY");

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const toggleExpanded = () => setIsExpanded((previous) => !previous);

  const isToday = isSameDay(date, new Date());
  const hasSessions = sessions.length > 0;
  const isRest = label?.rest === true && !hasSessions;

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: `${DAY_HEAD_WIDTH_PX}px 1fr`,
        columnGap: 2,
        px: 2.5,
        py: 2,
        transition: "background-color 150ms",
        ...(isToday && { bgcolor: alpha(theme.palette.primary.main, TODAY_BG_ALPHA) }),
      })}
    >
      <DayRowHead date={date} isToday={isToday} />

      <Stack direction="column" spacing={1.5} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexWrap: "wrap" }}>
          <LabelPickerChip
            value={label}
            options={dayOptions.options}
            level="DAY"
            isLoading={dayOptions.isLoading}
            onChange={(labelId) => updateLabel.mutate({ labelId })}
            ariaLabel="Day label"
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <InlineEditText
              value={notes ?? ""}
              onCommit={(next) => updateNotes.mutate({ notes: next === "" ? null : next })}
              variant="body2"
              ariaLabel="Day notes"
              multiline
              emptyIsValid
              placeholder="day note (cues, focus)…"
              maxLength={DAY_CONSTANTS.MAX_NOTES_LENGTH}
            />
          </Box>
          {hasSessions ? (
            <IconButton
              size="small"
              onClick={toggleExpanded}
              aria-label={isExpanded ? "Collapse day" : "Expand day"}
            >
              {isExpanded ? (
                <UnfoldLessIcon fontSize="small" />
              ) : (
                <UnfoldMoreIcon fontSize="small" />
              )}
            </IconButton>
          ) : null}
        </Stack>

        {isRest ? (
          <DayRowRest notes={notes} />
        ) : !hasSessions ? (
          <DayRowEmpty />
        ) : !isExpanded ? (
          <DayRowSummary sessions={sessions} onClick={toggleExpanded} />
        ) : (
          <SessionList
            planId={planId}
            startDate={startDate}
            dayOfWeek={dayOfWeek}
            sessions={sessions}
          />
        )}
      </Stack>
    </Box>
  );
};
