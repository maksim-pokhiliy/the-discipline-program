"use client";

import { useDroppable } from "@dnd-kit/core";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Card,
  CardContent,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import { type PlanStructureDay } from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { usePlanHistoryContext } from "../undo-redo";

import { AddSessionCta } from "./add-session-cta";
import { countDayEntities, isContainerEmpty } from "./count-nested-entities";
import { DecorationBadge } from "./decoration-badge";
import { DeleteEntityDialog } from "./delete-entity-dialog";
import { useEffectivePlanDecorationContext } from "./effective-plan-decoration-context";
import { getDecorationStyles } from "./get-decoration-styles";
import { buildCreateDay, buildDeleteDay, buildOptimisticDeleteDay } from "./op-builders";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { RowActionMenu } from "./row-action-menu";
import { type PlanSelection } from "./selection";
import { SessionList } from "./session-list";
import { useDeleteEntityDialog } from "./use-delete-entity-dialog";
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
  planId: string;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

export const DayCard = ({ day, planId, selection, onSelect }: DayCardProps) => {
  const decoration = useEffectivePlanDecorationContext().getDecoration(day.id);
  const decorationStyles = getDecorationStyles(decoration);
  const touchTargetSx = useTouchTargetSx();
  const bulkPatch = usePlanBulkPatch(planId);
  const history = usePlanHistoryContext();
  const dialog = useDeleteEntityDialog();
  const counts = countDayEntities(day);
  const dayLabel = DAY_LABEL[day.dayOfWeek];
  const droppable = useDroppable({
    id: `day:${day.id}`,
    data: { kind: "day", dayId: day.id },
  });

  const handleConfirm = async () => {
    const isEmpty = isContainerEmpty(counts);
    const op = buildDeleteDay({ dayId: day.id, expectedVersion: day.version });
    const optimisticPatch = isEmpty ? buildOptimisticDeleteDay(day.id) : undefined;
    const inverseOp = isEmpty
      ? buildCreateDay({
          weekId: day.weekId,
          dayOfWeek: day.dayOfWeek,
          kind: day.kind,
          ...(day.notes !== null ? { notes: day.notes } : {}),
        })
      : null;

    try {
      await bulkPatch.mutateAsync({ ops: [op], ...(optimisticPatch ? { optimisticPatch } : {}) });
      dialog.close();

      if (inverseOp && history) {
        history.push({
          id: `delete-day-${day.id}-${Date.now().toString()}`,
          forward: [op],
          inverse: [inverseOp],
          label: "Delete day",
        });
      }
    } catch {
      return;
    }
  };

  return (
    <Card
      ref={droppable.setNodeRef}
      variant="outlined"
      sx={[
        {
          minWidth: 260,
          flex: "1 1 260px",
          bgcolor: droppable.isOver ? "action.hover" : undefined,
          transition: "background-color 0.15s",
        },
        ...(Array.isArray(decorationStyles.sx) ? decorationStyles.sx : [decorationStyles.sx]),
      ]}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1} sx={touchTargetSx}>
            <Typography variant="subtitle1">{dayLabel}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {day.kind === "REST" ? "Rest" : "Workout"}
            </Typography>
            <DecorationBadge styles={decorationStyles} />
            <RowActionMenu ariaLabel={`${dayLabel} actions`}>
              {(close) => (
                <MenuItem
                  onClick={() => {
                    close();
                    dialog.open();
                  }}
                  sx={{ color: "error.main" }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete day</ListItemText>
                </MenuItem>
              )}
            </RowActionMenu>
          </Stack>

          {day.sessions.length === 0 ? (
            <AddSessionCta planId={planId} dayId={day.id} />
          ) : (
            day.sessions.map((session) => (
              <SessionList
                key={session.id}
                session={session}
                planId={planId}
                selection={selection}
                onSelect={onSelect}
              />
            ))
          )}
        </Stack>
      </CardContent>
      <DeleteEntityDialog
        isOpen={dialog.isOpen}
        onClose={dialog.close}
        onConfirm={() => {
          void handleConfirm();
        }}
        entityKind="day"
        entityLabel={dayLabel}
        counts={counts}
        isPending={bulkPatch.isPending}
      />
    </Card>
  );
};
