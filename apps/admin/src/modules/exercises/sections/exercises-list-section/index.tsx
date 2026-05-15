"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type Exercise } from "@repo/contracts/cms/exercise";
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

import { COMPOUND_TYPE_LABELS, EQUIPMENT_LABELS, MOVEMENT_TYPE_LABELS } from "../../constants";

const PLACEHOLDER_TRUE = "true";
const PLACEHOLDER_FALSE = "false";

const buildEnumOptions = (labels: Record<string, string>): { label: string; value: string }[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const filters: DataTableFilter<Exercise>[] = [
  {
    id: "primaryEquipment",
    label: "Equipment",
    options: buildEnumOptions(EQUIPMENT_LABELS),
    match: (exercise, value) => exercise.primaryEquipment === value,
  },
  {
    id: "movementTypeTagPrimary",
    label: "Movement Type",
    options: buildEnumOptions(MOVEMENT_TYPE_LABELS),
    match: (exercise, value) => exercise.movementTypeTagPrimary === value,
  },
  {
    id: "canonicalCompoundType",
    label: "Compound Type",
    options: buildEnumOptions(COMPOUND_TYPE_LABELS),
    match: (exercise, value) => exercise.canonicalCompoundType === value,
  },
  {
    id: "placeholderFlag",
    label: "Placeholder",
    options: [
      { label: "Yes", value: PLACEHOLDER_TRUE },
      { label: "No", value: PLACEHOLDER_FALSE },
    ],
    match: (exercise, value) => exercise.placeholderFlag === (value === PLACEHOLDER_TRUE),
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
        id: "primaryEquipment",
        label: "Equipment",
        width: "16%",
        render: (exercise) => (
          <Chip
            label={EQUIPMENT_LABELS[exercise.primaryEquipment]}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "movementTypeTagPrimary",
        label: "Movement",
        width: "16%",
        render: (exercise) => (
          <Chip
            label={MOVEMENT_TYPE_LABELS[exercise.movementTypeTagPrimary]}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "canonicalCompoundType",
        label: "Compound",
        width: "14%",
        render: (exercise) => (
          <Chip
            label={COMPOUND_TYPE_LABELS[exercise.canonicalCompoundType]}
            size="small"
            variant="outlined"
            color="primary"
          />
        ),
      },
      {
        id: "placeholderFlag",
        label: "Placeholder",
        width: "8%",
        align: "center",
        render: (exercise) =>
          exercise.placeholderFlag ? (
            <Tooltip title="Placeholder slot">
              <HelpOutlineIcon color="primary" fontSize="small" />
            </Tooltip>
          ) : null,
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
