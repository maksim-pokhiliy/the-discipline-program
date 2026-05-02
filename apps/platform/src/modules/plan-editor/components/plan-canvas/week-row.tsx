"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import { ListItemIcon, ListItemText, MenuItem, Stack, Typography } from "@mui/material";

import { type PlanStructureWeek } from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { countWeekEntities, isContainerEmpty } from "./count-nested-entities";
import { DayCard } from "./day-card";
import { DeleteEntityDialog } from "./delete-entity-dialog";
import { buildDeleteWeek, buildOptimisticDeleteWeek } from "./op-builders";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { RowActionMenu } from "./row-action-menu";
import { type PlanSelection } from "./selection";
import { useDeleteEntityDialog } from "./use-delete-entity-dialog";

export type WeekRowProps = {
  week: PlanStructureWeek;
  planId: string;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

export const WeekRow = ({ week, planId, selection, onSelect }: WeekRowProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const dialog = useDeleteEntityDialog();
  const counts = countWeekEntities(week);
  const entityLabel = `${(week.index + 1).toString()}${week.label ? ` — ${week.label}` : ""}`;

  const handleConfirm = async () => {
    const op = buildDeleteWeek({ weekId: week.id, expectedVersion: week.version });
    const optimisticPatch = isContainerEmpty(counts)
      ? buildOptimisticDeleteWeek(week.id)
      : undefined;

    try {
      await bulkPatch.mutateAsync({ ops: [op], ...(optimisticPatch ? { optimisticPatch } : {}) });
      dialog.close();
    } catch {
      return;
    }
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
          Week {week.index + 1}
          {week.label ? ` — ${week.label}` : ""}
        </Typography>
        <RowActionMenu ariaLabel={`Week ${(week.index + 1).toString()} actions`}>
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
              <ListItemText>Delete week</ListItemText>
            </MenuItem>
          )}
        </RowActionMenu>
      </Stack>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {week.days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            planId={planId}
            selection={selection}
            onSelect={onSelect}
          />
        ))}
      </Stack>
      <DeleteEntityDialog
        isOpen={dialog.isOpen}
        onClose={dialog.close}
        onConfirm={() => {
          void handleConfirm();
        }}
        entityKind="week"
        entityLabel={entityLabel}
        counts={counts}
        isPending={bulkPatch.isPending}
      />
    </Stack>
  );
};
