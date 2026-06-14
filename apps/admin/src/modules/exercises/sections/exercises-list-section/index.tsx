"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type Exercise } from "@repo/contracts/lms/exercise";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteExercise } from "@app/lib/hooks";

import { NATURE_LABELS } from "../../constants";

const buildEquipmentFilterOptions = (exercises: Exercise[]): { label: string; value: string }[] => {
  const byId = new Map<string, string>();

  for (const exercise of exercises) {
    for (const item of exercise.equipment) {
      byId.set(item.id, item.name);
    }
  }

  return [...byId.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const buildFilters = (exercises: Exercise[]): DataTableFilter<Exercise>[] => [
  {
    id: "equipment",
    label: "Equipment",
    options: buildEquipmentFilterOptions(exercises),
    match: (exercise, value) => exercise.equipment.some((item) => item.id === value),
  },
  {
    id: "nature",
    label: "Nature",
    options: Object.entries(NATURE_LABELS).map(([value, label]) => ({ value, label })),
    match: (exercise, value) => exercise.nature === value,
  },
];

type ExercisesListSectionProps = {
  exercises: Exercise[];
};

export const ExercisesListSection = ({ exercises }: ExercisesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteExercise();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const filters = useMemo(() => buildFilters(exercises), [exercises]);

  const columns: Column<Exercise>[] = useMemo(
    () => [
      {
        id: "canonicalName",
        label: "Name",
        width: "26%",
        sortable: true,
        sortValue: (exercise) => exercise.canonicalName,
        searchValue: (exercise) => [exercise.canonicalName, ...exercise.aliases].join(" "),
        render: (exercise) => (
          <Typography
            component={Link}
            href={`/exercises/${exercise.id}`}
            variant="subtitle2"
            color="primary"
            sx={{ textDecoration: "none" }}
          >
            {exercise.canonicalName}
          </Typography>
        ),
      },
      {
        id: "equipment",
        label: "Equipment",
        width: "24%",
        render: (exercise) =>
          exercise.equipment.length > 0 ? (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {exercise.equipment.map((item) => (
                <Chip key={item.id} label={item.name} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          ),
      },
      {
        id: "nature",
        label: "Nature",
        width: "12%",
        render: (exercise) => (
          <Chip
            label={NATURE_LABELS[exercise.nature]}
            size="small"
            variant="outlined"
            color="primary"
          />
        ),
      },
      {
        id: "movementFamily",
        label: "Movement Family",
        width: "16%",
        render: (exercise) => (
          <Typography variant="body2" color="text.secondary">
            {exercise.movementFamily ?? "—"}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "10%",
        sortable: true,
        sortValue: (exercise) => new Date(exercise.createdAt).getTime(),
        render: (exercise) => (
          <Typography variant="body2">{formatDate(exercise.createdAt)}</Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "10%",
        render: (exercise) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/exercises/${exercise.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton
                onClick={() => requestDelete(exercise.id)}
                color="error"
                aria-label="Delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
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
        searchPlaceholder="Search by name or alias"
        filters={filters}
        action={<CreateButton href="/exercises/create">Create Exercise</CreateButton>}
        paginated
        emptyMessage="No exercises yet. Create the first one!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Exercise"
        message="Are you sure you want to delete this exercise?"
        details="This action cannot be undone."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </>
  );
};
