"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

import { type PlanStructureDay } from "@repo/contracts/lms/training-plan";

import { DecorationBadge } from "./decoration-badge";
import { useEffectivePlanDecorationContext } from "./effective-plan-decoration-context";
import { getDecorationStyles } from "./get-decoration-styles";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { type PlanSelection } from "./selection";
import { SessionList } from "./session-list";
import { useTouchTargetSx } from "./use-touch-target-sx";

const DAY_LABEL: Record<PlanStructureDay["dayOfWeek"], string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export type DayCardProps = {
  day: PlanStructureDay;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

export const DayCard = ({ day, selection, onSelect }: DayCardProps) => {
  const decoration = useEffectivePlanDecorationContext().getDecoration(day.id);
  const decorationStyles = getDecorationStyles(decoration);
  const touchTargetSx = useTouchTargetSx();

  return (
    <Card
      variant="outlined"
      sx={[
        { minWidth: 260, flex: "1 1 260px" },
        ...(Array.isArray(decorationStyles.sx) ? decorationStyles.sx : [decorationStyles.sx]),
      ]}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={touchTargetSx}>
            <Typography variant="subtitle1">{DAY_LABEL[day.dayOfWeek]}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {day.kind === "REST" ? "Rest" : "Workout"}
            </Typography>
            <DecorationBadge styles={decorationStyles} />
          </Stack>

          {day.sessions.length === 0 ? (
            <Typography variant="caption" color="text.disabled">
              No sessions
            </Typography>
          ) : (
            day.sessions.map((session) => (
              <SessionList
                key={session.id}
                session={session}
                selection={selection}
                onSelect={onSelect}
              />
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
