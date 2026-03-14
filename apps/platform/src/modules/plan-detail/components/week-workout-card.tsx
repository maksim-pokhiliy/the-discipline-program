"use client";

import { type KeyboardEvent, useCallback, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Stack,
  Typography,
} from "@mui/material";

import { WEIGHT_UNIT_LABELS, WeightType } from "@repo/contracts/prescribed-set";
import type { Workout, WorkoutPreviewBlock } from "@repo/contracts/workout";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteWorkout, useUpdateWorkout, useWorkoutPreview } from "@app/lib/hooks";

type WeekWorkoutCardProps = {
  workout: Workout;
  planId: string;
  autoFocus?: boolean;
};

const formatExerciseDetail = (ex: WorkoutPreviewBlock["exercises"][number]): string => {
  const parts: string[] = [];

  if (ex.sets && ex.reps) {
    parts.push(`${ex.sets}×${ex.reps}`);
  } else if (ex.sets) {
    parts.push(`${ex.sets} sets`);
  } else if (ex.reps) {
    parts.push(`${ex.reps} reps`);
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

  const { data: preview, isLoading: previewLoading } = useWorkoutPreview(
    planId,
    workout.id,
    expanded,
  );

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <Accordion
        ref={setNodeRef}
        {...attributes}
        tabIndex={-1}
        expanded={expanded}
        onChange={(_, isExpanded) => setExpanded(isExpanded)}
        disableGutters
        elevation={0}
        variant="outlined"
        style={style}
        slotProps={{ transition: { unmountOnExit: true } }}
        sx={{
          "&::before": { display: "none" },
          "& .MuiAccordionSummary-root": { minHeight: 0, px: 0 },
          "& .MuiAccordionSummary-content": { m: 0 },
        }}
      >
        <AccordionSummary
          expandIcon={
            workout.blockCount > 0 ? (
              <ExpandMoreIcon fontSize="small" sx={{ color: "text.disabled" }} />
            ) : undefined
          }
          sx={{ "& .MuiAccordionSummary-expandIconWrapper": { mr: 0.5 } }}
        >
          <Stack direction="row" sx={{ alignItems: "center", flex: 1 }}>
            <Stack
              {...listeners}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
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
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              autoFocus={autoFocus}
              placeholder="Workout title..."
              sx={{ flex: 1, typography: "body2", "& input": { p: 0, py: 1, fontWeight: 500 } }}
              slotProps={{ input: { maxLength: 200 } }}
            />

            {workout.blockCount > 0 && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", whiteSpace: "nowrap", mr: 0.5 }}
              >
                {workout.blockCount} {workout.blockCount === 1 ? "block" : "blocks"}
              </Typography>
            )}

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
              }}
              sx={{ color: "text.disabled" }}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              sx={{ mr: 0.5, color: "text.disabled", "&:hover": { color: "error.main" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
          {previewLoading && (
            <Stack sx={{ alignItems: "center", py: 2 }}>
              <CircularProgress size={20} />
            </Stack>
          )}

          {preview && preview.blocks.length === 0 && (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              No blocks yet
            </Typography>
          )}

          {preview &&
            preview.blocks.map((block, blockIndex) => (
              <Box key={block.id} sx={{ mt: blockIndex > 0 ? 1.5 : 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {block.categoryName}
                  </Typography>
                  {block.rounds && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {block.rounds} {block.rounds === 1 ? "round" : "rounds"}
                    </Typography>
                  )}
                  {block.timeCapSec && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {Math.floor(block.timeCapSec / 60)} min cap
                    </Typography>
                  )}
                </Stack>

                {block.exercises.length === 0 && (
                  <Typography variant="caption" sx={{ color: "text.disabled", pl: 1.5 }}>
                    No exercises
                  </Typography>
                )}

                {block.exercises.map((ex, exIndex) => (
                  <Stack
                    key={exIndex}
                    direction="row"
                    sx={{ justifyContent: "space-between", pl: 1.5, py: 0.25 }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {ex.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                      {formatExerciseDetail(ex)}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            ))}
        </AccordionDetails>
      </Accordion>

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
  <Accordion
    disableGutters
    elevation={0}
    variant="outlined"
    expanded={false}
    sx={(theme) => ({
      p: 1.5,
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[4],
      "&::before": { display: "none" },
    })}
  >
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {workout.title || "Untitled workout"}
    </Typography>
  </Accordion>
);
