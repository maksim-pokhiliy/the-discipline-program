"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type Exercise } from "@repo/contracts/exercise";
import { type ExerciseCategory } from "@repo/contracts/exercise-category";
import { ConfirmationModal, DataTable, type Column, type DataTableFilter } from "@repo/ui";

import { useDeleteExercise } from "@app/lib/hooks";

import { ManageCategoriesDialog } from "../../components/manage-categories-dialog";

interface ExercisesListSectionProps {
  exercises: Exercise[];
  categories: ExerciseCategory[];
}

export const ExercisesListSection = ({ exercises, categories }: ExercisesListSectionProps) => {
  const { mutate: deleteExercise, isPending: isDeleting } = useDeleteExercise();
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    if (exerciseToDelete) {
      await deleteExercise(exerciseToDelete, {
        onSuccess: () => setExerciseToDelete(null),
      });
    }
  };

  const filters: DataTableFilter<Exercise>[] = [
    {
      id: "category",
      label: "Category",
      options: categories.map((c) => ({ label: c.name, value: c.id })),
      match: (item, value) => item.categoryId === value,
    },
  ];

  const columns: Column<Exercise>[] = [
    {
      id: "name",
      label: "Exercise Name",
      width: "40%",
      sortable: true,
      sortValue: (exercise) => exercise.name,
      searchValue: (exercise) => exercise.name,
      render: (exercise) => (
        <Typography variant="subtitle2" fontWeight={600}>
          {exercise.name}
        </Typography>
      ),
    },
    {
      id: "category",
      label: "Category",
      width: "25%",
      sortable: true,
      sortValue: (exercise) => exercise.category?.name ?? "",
      render: (exercise) =>
        exercise.category ? (
          <Chip label={exercise.category.name} size="small" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
    },
    {
      id: "videoUrl",
      label: "Video",
      width: "15%",
      render: (exercise) =>
        exercise.videoUrl ? (
          <Chip label="Yes" size="small" color="info" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      width: "20%",
      render: (exercise) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton
              component={Link}
              href={`/exercises/${exercise.id}`}
              size="small"
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setExerciseToDelete(exercise.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={exercises}
        columns={columns}
        title="Exercises"
        searchPlaceholder="Search exercises..."
        filters={filters}
        action={
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setCategoriesOpen(true)} variant="outlined" size="medium">
              Manage Categories
            </Button>

            <Button
              component={Link}
              href="/exercises/create"
              variant="contained"
              startIcon={<AddIcon />}
              size="medium"
            >
              Create Exercise
            </Button>
          </Stack>
        }
        paginated
        emptyMessage="No exercises found. Start by creating one!"
      />

      <ConfirmationModal
        open={!!exerciseToDelete}
        title="Delete Exercise"
        onClose={() => setExerciseToDelete(null)}
        type="danger"
        message="Are you sure you want to delete this exercise?"
        details="This will remove the exercise from the library. This action cannot be undone."
        confirmText="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      <ManageCategoriesDialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={categories}
        exercises={exercises}
      />
    </>
  );
};
