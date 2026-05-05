"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { MOVEMENT_PATTERN_LABELS, PR_KIND_LABELS } from "@repo/contracts/lms/_domain";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, useDataTableUrlState, type Column } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteExercise } from "@app/lib/hooks";

const EMPTY_VALUE_PLACEHOLDER = "—";

const formatUrlsLabel = (count: number) => `${count} link${count === 1 ? "" : "s"}`;

type ExercisesListSectionProps = {
  exercises: Exercise[];
};

export const ExercisesListSection = ({ exercises }: ExercisesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteExercise();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<Exercise>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "30%",
        sortable: true,
        sortValue: (exercise) => exercise.name,
        searchValue: (exercise) => exercise.name,
        render: (exercise) => (
          <Typography variant="body2" fontWeight={500}>
            {exercise.name}
          </Typography>
        ),
      },
      {
        id: "primaryMovement",
        label: "Primary Movement",
        width: "20%",
        render: (exercise) => (
          <Typography variant="body2">
            {MOVEMENT_PATTERN_LABELS[exercise.primaryMovement]}
          </Typography>
        ),
      },
      {
        id: "benchmarkPrKind",
        label: "Benchmark PR",
        width: "15%",
        render: (exercise) => (
          <Typography variant="body2" color="text.secondary">
            {exercise.benchmarkPrKind
              ? PR_KIND_LABELS[exercise.benchmarkPrKind]
              : EMPTY_VALUE_PLACEHOLDER}
          </Typography>
        ),
      },
      {
        id: "urls",
        label: "Videos",
        width: "10%",
        render: (exercise) => (
          <Typography variant="caption" color="text.secondary">
            {formatUrlsLabel(exercise.urls.length)}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "15%",
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
        searchPlaceholder="Search exercises..."
        action={<CreateButton href="/exercises/create">Create Exercise</CreateButton>}
        paginated
        emptyMessage="No exercises found. Add your first exercise!"
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
