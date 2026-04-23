"use client";

import { useCallback, useMemo, useState } from "react";

import { Stack, Typography } from "@mui/material";

import {
  ExerciseStatus,
  type ExerciseListItem,
  type MergeExerciseData,
  type RejectExerciseData,
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

import { CreateButton } from "@app/lib/components/create-button";
import {
  useApproveLibraryExercise,
  useDeleteLibraryExercise,
  useMergeLibraryExercise,
  useRejectLibraryExercise,
} from "@app/lib/hooks";

import { ExerciseRowActions, ExerciseStatusChip, MergeDialog, RejectDialog } from "../components";
import { EXERCISE_STATUS_CONFIG } from "../constants";

const STATUS_FILTER_ID = "status";

const filters: DataTableFilter<ExerciseListItem>[] = [
  {
    id: STATUS_FILTER_ID,
    label: "Status",
    options: Object.values(ExerciseStatus).map((status) => ({
      label: EXERCISE_STATUS_CONFIG[status].label,
      value: status,
    })),
    match: (item, value) => item.status === value,
  },
];

type ExercisesListSectionProps = {
  exercises: ExerciseListItem[];
  defaultStatusFilter?: ExerciseStatus;
};

export const ExercisesListSection = ({
  exercises,
  defaultStatusFilter,
}: ExercisesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "createdAt", direction: "desc" },
  });

  const effectiveState = useMemo(() => {
    if (!defaultStatusFilter) {
      return state;
    }

    const hasStatus = !!state.filters[STATUS_FILTER_ID];

    if (hasStatus) {
      return state;
    }

    return {
      ...state,
      filters: { ...state.filters, [STATUS_FILTER_ID]: defaultStatusFilter },
    };
  }, [state, defaultStatusFilter]);

  const deleteMutation = useDeleteLibraryExercise();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const { mutate: approve, isPending: isApproving } = useApproveLibraryExercise();
  const { mutate: reject, isPending: isRejecting } = useRejectLibraryExercise();
  const { mutate: merge, isPending: isMerging } = useMergeLibraryExercise();

  const [rejectTarget, setRejectTarget] = useState<ExerciseListItem | null>(null);
  const [mergeTarget, setMergeTarget] = useState<ExerciseListItem | null>(null);

  const handleApprove = useCallback(
    (id: string) => {
      approve(id);
    },
    [approve],
  );

  const handleReject = useCallback((exercise: ExerciseListItem) => {
    setRejectTarget(exercise);
  }, []);

  const handleMerge = useCallback((exercise: ExerciseListItem) => {
    setMergeTarget(exercise);
  }, []);

  const handleConfirmReject = useCallback(
    (data: RejectExerciseData) => {
      if (!rejectTarget) {
        return;
      }

      reject({ id: rejectTarget.id, data }, { onSuccess: () => setRejectTarget(null) });
    },
    [reject, rejectTarget],
  );

  const handleConfirmMerge = useCallback(
    (data: MergeExerciseData) => {
      if (!mergeTarget) {
        return;
      }

      merge({ id: mergeTarget.id, data }, { onSuccess: () => setMergeTarget(null) });
    },
    [merge, mergeTarget],
  );

  const columns: Column<ExerciseListItem>[] = useMemo(
    () => [
      {
        id: "canonicalName",
        label: "Name",
        width: "35%",
        sortable: true,
        sortValue: (item) => item.canonicalName.toLowerCase(),
        searchValue: (item) => [item.canonicalName, ...item.aliases].join(" "),
        render: (item) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{item.canonicalName}</Typography>
            {item.aliases.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {item.aliases.slice(0, 3).join(", ")}
                {item.aliases.length > 3 ? "..." : ""}
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        id: "usageCount",
        label: "Uses",
        width: "10%",
        align: "right",
        sortable: true,
        sortValue: (item) => item.usageCount,
        render: (item) => (
          <Typography variant="body2" color="text.secondary">
            {item.usageCount}
          </Typography>
        ),
      },
      {
        id: "status",
        label: "Status",
        width: "15%",
        sortable: true,
        sortValue: (item) => item.status,
        render: (item) => <ExerciseStatusChip status={item.status} />,
      },
      {
        id: "createdAt",
        label: "Created",
        width: "20%",
        sortable: true,
        sortValue: (item) => new Date(item.createdAt).getTime(),
        render: (item) => (
          <Typography variant="body2" color="text.secondary">
            {formatDate(item.createdAt)}
          </Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "20%",
        render: (item) => (
          <ExerciseRowActions
            exercise={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onMerge={handleMerge}
            onDelete={requestDelete}
          />
        ),
      },
    ],
    [handleApprove, handleReject, handleMerge, requestDelete],
  );

  return (
    <>
      <DataTable
        data={exercises}
        columns={columns}
        searchPlaceholder="Search by name or alias..."
        filters={filters}
        action={<CreateButton href="/library/exercises/create">Create Exercise</CreateButton>}
        paginated
        emptyMessage="No exercises found."
        state={effectiveState}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Exercise"
        message="Are you sure you want to delete this exercise?"
        details="This will soft-delete the exercise. References in existing workouts are preserved."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting || isApproving}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />

      <RejectDialog
        open={!!rejectTarget}
        exerciseName={rejectTarget?.canonicalName}
        isSubmitting={isRejecting}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      <MergeDialog
        open={!!mergeTarget}
        sourceId={mergeTarget?.id}
        sourceName={mergeTarget?.canonicalName}
        isSubmitting={isMerging}
        onClose={() => setMergeTarget(null)}
        onConfirm={handleConfirmMerge}
      />
    </>
  );
};
