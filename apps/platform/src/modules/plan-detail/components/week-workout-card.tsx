"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Skeleton,
  Stack,
} from "@mui/material";
import dynamic from "next/dynamic";

import type { TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import type { CreateExerciseData, ExerciseListItem } from "@repo/contracts/library/exercise";
import type { Workout } from "@repo/contracts/lms/workout";
import { ConfirmationModal } from "@repo/ui";

import {
  useCreateLibraryExercise,
  useDeleteWorkout,
  useLibraryBlockTypes,
  useLibraryExercises,
  useLibrarySchemes,
  useUpdateWorkout,
} from "@app/lib/hooks";

const WorkoutEditor = dynamic(
  () => import("@repo/ui").then((mod) => ({ default: mod.WorkoutEditor })),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={200} />,
  },
);

type WeekWorkoutCardProps = {
  workout: Workout;
  planId: string;
  autoFocus?: boolean;
};

export const WeekWorkoutCard: React.FC<WeekWorkoutCardProps> = ({ workout, planId, autoFocus }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: workout.id,
    data: { workout, scheduledDate: workout.scheduledDate },
  });
  const deleteWorkout = useDeleteWorkout(planId);
  const updateWorkout = useUpdateWorkout(planId);
  const { data: blockTypesData } = useLibraryBlockTypes();
  const blockTypes = useMemo(() => blockTypesData ?? [], [blockTypesData]);
  const { data: schemesData } = useLibrarySchemes();
  const schemes = useMemo(() => schemesData ?? [], [schemesData]);
  const { data: exerciseListData } = useLibraryExercises({ includeOwnDrafts: true, limit: 500 });
  const exercises = useMemo(() => exerciseListData?.items ?? [], [exerciseListData]);
  const createExerciseMutation = useCreateLibraryExercise();
  const createExercise = useCallback(
    async (data: CreateExerciseData): Promise<ExerciseListItem> => {
      const exercise = await createExerciseMutation.mutateAsync(data);

      return { ...exercise, usageCount: 0 };
    },
    [createExerciseMutation],
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editValue, setEditValue] = useState(workout.title);
  const [expanded, setExpanded] = useState(false);
  const contentDocRef = useRef<TiptapDoc | null>(workout.contentDoc);

  const commitTitle = useCallback(() => {
    const trimmed = editValue.trim();

    if (trimmed !== workout.title) {
      updateWorkout.mutate({ id: workout.id, data: { title: trimmed } });
    } else {
      setEditValue(workout.title);
    }
  }, [editValue, workout.id, workout.title, updateWorkout]);

  const handleEditorChange = useCallback((doc: TiptapDoc | null) => {
    contentDocRef.current = doc;
  }, []);

  const commitContent = useCallback(() => {
    const current = contentDocRef.current;

    updateWorkout.mutate({ id: workout.id, data: { contentDoc: current } });
  }, [updateWorkout, workout.id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <Paper
        ref={setNodeRef}
        {...attributes}
        tabIndex={-1}
        variant="outlined"
        style={style}
        sx={(theme) => ({
          "& .workout-action": {
            opacity: { xs: 1, md: 0 },
            transition: theme.transitions.create("opacity"),
          },
          [theme.breakpoints.up("md")]: {
            "&:hover .workout-action": { opacity: 1 },
          },
        })}
      >
        <Stack direction="row" alignItems="center">
          <Stack
            className="workout-action"
            {...listeners}
            tabIndex={-1}
            alignItems="center"
            justifyContent="center"
            sx={{
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
            onBlur={commitTitle}
            autoFocus={autoFocus}
            placeholder="Workout title..."
            sx={{ flex: 1, typography: "body2", "& input": { p: 0, py: 1 } }}
            slotProps={{ input: { maxLength: 200 } }}
          />

          <IconButton
            className={expanded ? undefined : "workout-action"}
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Collapse workout" : "Expand workout"}
            sx={{ color: "text.disabled" }}
          >
            <ExpandMoreIcon
              fontSize="small"
              sx={(theme) => ({
                transition: theme.transitions.create("transform"),
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              })}
            />
          </IconButton>

          <IconButton
            className="workout-action"
            onClick={() => setConfirmOpen(true)}
            aria-label="Delete workout"
            sx={{ mr: 0.5 }}
            color="error"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Collapse in={expanded} unmountOnExit>
          <Divider />
          <Box sx={{ px: 2, py: 2 }}>
            <WorkoutEditor
              value={workout.contentDoc}
              onChange={handleEditorChange}
              onBlur={commitContent}
              exercises={exercises}
              createExercise={createExercise}
              schemes={schemes}
              blockTypes={blockTypes}
              placeholder="Type / to insert a block, @ to reference an exercise"
            />
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
