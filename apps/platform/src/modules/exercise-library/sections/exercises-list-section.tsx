"use client";

import { useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Chip, Stack, Typography } from "@mui/material";

import {
  EXERCISE_STATUS_LABELS,
  ExerciseStatus,
  MEASUREMENT_UNIT_LABELS,
  type ExerciseListItem,
} from "@repo/contracts/library/exercise";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { useDeleteLibraryExercise } from "@app/lib/hooks";

import {
  CreateExerciseDialog,
  EditExerciseDialog,
  ExerciseRowActions,
  ExerciseStatusChip,
} from "../components";

const statusFilter: DataTableFilter<ExerciseListItem> = {
  id: "status",
  label: "Status",
  options: Object.values(ExerciseStatus).map((status) => ({
    label: EXERCISE_STATUS_LABELS[status],
    value: status,
  })),
  match: (item, value) => item.status === value,
};

type ExercisesListSectionProps = {
  exercises: ExerciseListItem[];
};

export const ExercisesListSection = ({ exercises }: ExercisesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "createdAt", direction: "desc" },
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<ExerciseListItem | null>(null);
  const deleteMutation = useDeleteLibraryExercise();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<ExerciseListItem>[] = useMemo(
    () => [
      {
        id: "canonicalName",
        label: "Name",
        width: "30%",
        sortable: true,
        sortValue: (ex) => ex.canonicalName.toLowerCase(),
        searchValue: (ex) => ex.canonicalName,
        render: (ex) => <Typography variant="subtitle2">{ex.canonicalName}</Typography>,
      },
      {
        id: "measurementUnits",
        label: "Units",
        width: "20%",
        render: (ex) => (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {ex.measurementUnits.map((unit) => (
              <Chip
                key={unit}
                label={MEASUREMENT_UNIT_LABELS[unit]}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        ),
      },
      {
        id: "status",
        label: "Status",
        width: "15%",
        sortable: true,
        sortValue: (ex) => ex.status,
        render: (ex) => <ExerciseStatusChip status={ex.status} />,
      },
      {
        id: "usageCount",
        label: "Usage",
        width: "10%",
        align: "right",
        sortable: true,
        sortValue: (ex) => ex.usageCount,
        render: (ex) => (
          <Typography variant="body2" color="text.secondary">
            {ex.usageCount}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "15%",
        sortable: true,
        sortValue: (ex) => new Date(ex.createdAt).getTime(),
        render: (ex) => (
          <Typography variant="body2" color="text.secondary">
            {formatDate(ex.createdAt)}
          </Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "10%",
        render: (ex) => (
          <ExerciseRowActions
            exercise={ex}
            onEdit={setEditExercise}
            onDelete={(item) => requestDelete(item.id)}
          />
        ),
      },
    ],
    [requestDelete],
  );

  return (
    <>
      <DataTable
        data={exercises}
        columns={columns}
        searchPlaceholder="Search by name..."
        filters={[statusFilter]}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create exercise
          </Button>
        }
        paginated
        emptyMessage="No exercises yet. Create one to get started."
        state={state}
        onStateChange={onStateChange}
      />

      <CreateExerciseDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditExerciseDialog
        open={!!editExercise}
        exercise={editExercise}
        onClose={() => setEditExercise(null)}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete exercise"
        message="Are you sure you want to delete this exercise?"
        details="Only pending-review exercises you created can be deleted."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </>
  );
};
