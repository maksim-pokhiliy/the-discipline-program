"use client";

import { type KeyboardEvent, useCallback, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { WEIGHT_UNIT_LABELS, WeightType } from "@repo/contracts/prescribed-set";
import type { Workout, WorkoutPreviewBlock } from "@repo/contracts/workout";
import { SECTION_TYPE_LABELS, SectionType } from "@repo/contracts/workout-block";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteWorkout, useUpdateWorkout, useWorkoutPreview } from "@app/lib/hooks";

type WeekWorkoutCardProps = {
  workout: Workout;
  planId: string;
  autoFocus?: boolean;
};

type ExerciseEntry = WorkoutPreviewBlock["exercises"][number];

type GroupedExercise = ExerciseEntry & { count: number };

const groupExercises = (exercises: ExerciseEntry[]): GroupedExercise[] => {
  const groups: GroupedExercise[] = [];

  for (const ex of exercises) {
    const prev = groups[groups.length - 1];
    const isSame =
      prev &&
      prev.name === ex.name &&
      prev.reps === ex.reps &&
      prev.weightValue === ex.weightValue &&
      prev.weightUnit === ex.weightUnit &&
      prev.weightType === ex.weightType &&
      prev.rpe === ex.rpe;

    if (isSame) {
      prev.count += 1;
    } else {
      groups.push({ ...ex, count: 1 });
    }
  }

  return groups;
};

const formatExerciseDetail = (ex: GroupedExercise): string => {
  const parts: string[] = [];

  if (ex.count > 1 && ex.reps) {
    parts.push(`${ex.count}×${ex.reps}`);
  } else if (ex.reps) {
    parts.push(`${ex.reps} reps`);
  } else if (ex.count > 1) {
    parts.push(`${ex.count} sets`);
  }

  if (ex.weightValue) {
    const unit = WEIGHT_UNIT_LABELS[ex.weightUnit];
    const suffix = ex.weightType === WeightType.PERCENTAGE ? "%" : unit;

    parts.push(`@ ${ex.weightValue}${suffix}`);
  } else if (ex.rpe) {
    parts.push(`@ RPE ${ex.rpe}`);
  }

  return parts.join(" ");
};

const formatBlockHeader = (block: WorkoutPreviewBlock): string => {
  if (block.title) {
    return block.title;
  }

  if (block.categoryName) {
    return block.categoryName;
  }

  return SECTION_TYPE_LABELS[block.sectionType];
};

const GROUPABLE_TYPES = new Set([SectionType.STRENGTH, SectionType.CUSTOM]);

const formatBlockMeta = (block: WorkoutPreviewBlock): string | null => {
  const parts: string[] = [];

  if (block.sectionType === SectionType.EMOM) {
    if (block.intervalSec) {
      const mins = Math.floor(block.intervalSec / 60);

      parts.push(mins <= 1 ? "EMOM" : `E${mins}MOM`);
    } else {
      parts.push("EMOM");
    }
  } else if (block.sectionType !== SectionType.CUSTOM) {
    parts.push(SECTION_TYPE_LABELS[block.sectionType]);
  }

  if (block.rounds) {
    parts.push(`× ${block.rounds}`);
  }

  if (block.timeCapSec) {
    parts.push(`${Math.floor(block.timeCapSec / 60)} min cap`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
};

const WorkoutPreviewContent: React.FC<{ planId: string; workout: Workout }> = ({
  planId,
  workout,
}) => {
  const { data: preview, isLoading } = useWorkoutPreview(planId, workout.id, true);

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: "center", py: 2 }}>
        <CircularProgress size={20} />
      </Stack>
    );
  }

  if (!preview || preview.blocks.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        No blocks yet
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {preview.blocks.map((block) => {
        const meta = formatBlockMeta(block);

        return (
          <Box key={block.id}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                {formatBlockHeader(block)}
              </Typography>
              {meta && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {meta}
                </Typography>
              )}
            </Stack>

            {block.exercises.length === 0 && (
              <Typography variant="caption" sx={{ color: "text.disabled", pl: 1.5 }}>
                No exercises
              </Typography>
            )}

            {(GROUPABLE_TYPES.has(block.sectionType)
              ? groupExercises(block.exercises)
              : block.exercises.map((ex) => ({ ...ex, count: 1 }))
            ).map((ex, exIndex) => {
              const detail = formatExerciseDetail(ex);

              return (
                <Box key={exIndex} sx={{ pl: 1.5, py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    {ex.name}
                  </Typography>
                  {detail && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}
                    >
                      {detail}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Stack>
  );
};

export const WeekWorkoutCard: React.FC<WeekWorkoutCardProps> = ({ workout, planId, autoFocus }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: workout.id,
    data: { workout, scheduledDate: workout.scheduledDate },
  });
  const deleteWorkout = useDeleteWorkout(planId);
  const updateWorkout = useUpdateWorkout(planId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editValue, setEditValue] = useState(workout.title);
  const [expanded, setExpanded] = useState(false);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();

    if (trimmed !== workout.title) {
      updateWorkout.mutate({ id: workout.id, data: { title: trimmed } });
    } else {
      setEditValue(workout.title);
    }
  }, [editValue, workout.id, workout.title, updateWorkout]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const canExpand = workout.blockCount > 0;

  const handleToggle = () => {
    if (canExpand) {
      setExpanded((prev) => !prev);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <Paper ref={setNodeRef} {...attributes} tabIndex={-1} variant="outlined" style={style}>
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Stack
            {...listeners}
            tabIndex={-1}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              px: 0.5,
              py: 1.5,
              cursor: "grab",
              color: "text.disabled",
              touchAction: "none",
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Stack>

          <InputBase
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            placeholder="Workout title..."
            sx={{ flex: 1, typography: "body2", "& input": { p: 0, py: 1, fontWeight: 500 } }}
            slotProps={{ input: { maxLength: 200 } }}
          />

          {canExpand && (
            <Typography
              variant="caption"
              onClick={handleToggle}
              sx={{
                color: "text.secondary",
                whiteSpace: "nowrap",
                mr: 0.5,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {workout.blockCount} {workout.blockCount === 1 ? "block" : "blocks"}
            </Typography>
          )}

          {canExpand && (
            <IconButton size="small" onClick={handleToggle} sx={{ color: "text.disabled" }}>
              <ExpandMoreIcon
                fontSize="small"
                sx={(theme) => ({
                  transition: theme.transitions.create("transform"),
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                })}
              />
            </IconButton>
          )}

          <IconButton size="small" sx={{ color: "text.disabled" }}>
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => setConfirmOpen(true)}
            sx={{ mr: 0.5, color: "text.disabled", "&:hover": { color: "error.main" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Collapse in={expanded} unmountOnExit>
          <Divider />
          <Box sx={{ px: 1.5, py: 1.5 }}>
            <WorkoutPreviewContent planId={planId} workout={workout} />
          </Box>
        </Collapse>
      </Paper>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          deleteWorkout.mutate(workout.id, { onSuccess: () => setConfirmOpen(false) })
        }
        title="Delete Workout"
        message={`Are you sure you want to delete "${workout.title || "Untitled workout"}"? This action cannot be undone.`}
        type="danger"
        isConfirming={deleteWorkout.isPending}
      />
    </>
  );
};

export const WorkoutDragOverlay: React.FC<{ workout: Workout }> = ({ workout }) => (
  <Paper
    variant="outlined"
    sx={(theme) => ({
      p: 1.5,
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[4],
    })}
  >
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {workout.title || "Untitled workout"}
    </Typography>
  </Paper>
);
