"use client";

import { useMemo, useState } from "react";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";

import { type Exercise } from "@repo/contracts/exercise";
import { type ExerciseCategory } from "@repo/contracts/exercise-category";

import {
  useCreateExerciseCategory,
  useDeleteExerciseCategory,
  useUpdateExerciseCategory,
} from "@app/lib/hooks";

interface ManageCategoriesDialogProps {
  open: boolean;
  onClose: () => void;
  categories: ExerciseCategory[];
  exercises: Exercise[];
}

export const ManageCategoriesDialog = ({
  open,
  onClose,
  categories,
  exercises,
}: ManageCategoriesDialogProps) => {
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateExerciseCategory();
  const { mutateAsync: updateCategory } = useUpdateExerciseCategory();
  const { mutateAsync: deleteCategory } = useDeleteExerciseCategory();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const exerciseCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const exercise of exercises) {
      if (exercise.categoryId) {
        counts[exercise.categoryId] = (counts[exercise.categoryId] || 0) + 1;
      }
    }

    return counts;
  }, [exercises]);

  const handleStartEdit = (category: ExerciseCategory) => {
    setEditingId(category.id);
    setEditValue(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!editingId || !editValue.trim()) {
      return;
    }

    const category = categories.find((c) => c.id === editingId);

    if (category && category.name === editValue.trim()) {
      handleCancelEdit();

      return;
    }

    setLoadingId(editingId);

    try {
      await updateCategory({ id: editingId, data: { name: editValue.trim() } });
      handleCancelEdit();
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);

    try {
      await deleteCategory(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }

    await createCategory({ name: newName.trim(), sortOrder: categories.length });
    setNewName("");
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Manage Categories</DialogTitle>

      <DialogContent>
        <Stack direction="row" spacing={1} sx={{ p: 2 }}>
          <TextField
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            placeholder="New category name"
            size="small"
            fullWidth
            disabled={isCreating}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleCreate}
            disabled={!newName.trim() || isCreating}
          >
            Add
          </Button>
        </Stack>

        {categories.length > 0 && (
          <List disablePadding>
            {categories.map((category) => {
              const count = exerciseCounts[category.id] || 0;
              const isEditing = editingId === category.id;
              const isLoading = loadingId === category.id;

              return (
                <ListItem
                  key={category.id}
                  divider
                  secondaryAction={
                    isEditing ? (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={handleSave} disabled={isLoading}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancelEdit} disabled={isLoading}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => handleStartEdit(category)}
                          disabled={isLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <Tooltip
                          title={
                            count > 0
                              ? `Cannot delete: ${count} exercise${count !== 1 ? "s" : ""} use this category`
                              : "Delete"
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(category.id)}
                              disabled={count > 0 || isLoading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    )
                  }
                >
                  {isEditing ? (
                    <TextField
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      size="small"
                      fullWidth
                      autoFocus
                      disabled={isLoading}
                      sx={{ mr: 2 }}
                    />
                  ) : (
                    <ListItemText
                      primary={category.name}
                      secondary={`${count} exercise${count !== 1 ? "s" : ""}`}
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
