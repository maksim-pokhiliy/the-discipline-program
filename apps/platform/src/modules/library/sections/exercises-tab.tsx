"use client";

import { useCallback, useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, ButtonBase, Chip, Stack, Typography } from "@mui/material";

import { UserRole } from "@repo/contracts/iam/auth";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { useDeleteConfirmation } from "@repo/query";
import {
  type Column,
  ConfirmationModal,
  DataTable,
  type DataTableFilter,
  UserChip,
  useDataTableUrlState,
} from "@repo/ui";

import {
  useCurrentUserRole,
  useDeleteExercise,
  useDemoteExercise,
  useExercisesPageData,
  usePlatformCoaches,
  usePromoteExercise,
} from "@app/lib/hooks";

import { DemoteDialog, ExerciseFormModal, LibraryRowActions } from "../components";
import {
  formatToken,
  MODALITY_OPTIONS,
  MOVEMENT_PATTERN_OPTIONS,
  SCOPE_CHIP_COLOR,
} from "../constants";

type ExercisesTabProps = {
  currentUserId: string;
};

const SCOPE_FILTER_OPTIONS = [
  { value: "SYSTEM", label: "System" },
  { value: "COACH", label: "Coach (any)" },
  { value: "OWN", label: "Mine" },
];

export const ExercisesTab = ({ currentUserId }: ExercisesTabProps) => {
  const role = useCurrentUserRole();
  const isPrivileged = role === UserRole.HEAD_COACH || role === UserRole.ADMIN;

  const [editTarget, setEditTarget] = useState<ExerciseLibraryItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState<ExerciseLibraryItem | null>(null);

  const { data, isLoading, error } = useExercisesPageData({}, currentUserId);
  const { data: coaches } = usePlatformCoaches(isPrivileged);

  const deleteMutation = useDeleteExercise();
  const promoteMutation = usePromoteExercise();
  const demoteMutation = useDemoteExercise();

  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "name", direction: "asc" },
  });

  const ownerByUserId = useMemo(() => {
    const map = new Map<string, { id: string; name: string | null; email: string }>();

    coaches?.forEach((coach) => {
      map.set(coach.userId, { id: coach.userId, name: coach.name, email: coach.email });
    });

    return map;
  }, [coaches]);

  const isOwn = useCallback(
    (item: ExerciseLibraryItem) => item.scope === "COACH" && item.ownerId === currentUserId,
    [currentUserId],
  );

  const filters: DataTableFilter<ExerciseLibraryItem>[] = useMemo(
    () => [
      {
        id: "scope",
        label: "Scope",
        options: SCOPE_FILTER_OPTIONS,
        match: (item, value) => {
          if (value === "OWN") {
            return isOwn(item);
          }

          return item.scope === value;
        },
      },
      {
        id: "primaryMovement",
        label: "Movement",
        options: MOVEMENT_PATTERN_OPTIONS,
        match: (item, value) => item.primaryMovement === value,
      },
      {
        id: "modality",
        label: "Modality",
        options: MODALITY_OPTIONS,
        match: (item, value) => item.modality === value,
      },
    ],
    [isOwn],
  );

  const handleDemoteConfirm = useCallback(
    (newOwnerId: string) => {
      if (!demoteTarget) {
        return;
      }

      demoteMutation.mutate(
        { id: demoteTarget.id, newOwnerId },
        { onSettled: () => setDemoteTarget(null) },
      );
    },
    [demoteMutation, demoteTarget],
  );

  const columns: Column<ExerciseLibraryItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "24%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => `${item.name} ${item.nameAliases.join(" ")}`,
        render: (item) => {
          const canEdit = isPrivileged || isOwn(item);

          if (!canEdit) {
            return <Typography variant="subtitle2">{item.name}</Typography>;
          }

          return (
            <ButtonBase
              onClick={() => setEditTarget(item)}
              sx={{ textAlign: "left", justifyContent: "flex-start", width: "100%" }}
            >
              <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
                {item.name}
              </Typography>
            </ButtonBase>
          );
        },
      },
      {
        id: "scope",
        label: "Scope",
        width: "10%",
        sortable: true,
        sortValue: (item) => item.scope,
        render: (item) => (
          <Chip
            label={item.scope === "SYSTEM" ? "System" : isOwn(item) ? "Mine" : "Coach"}
            color={SCOPE_CHIP_COLOR[item.scope]}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "owner",
        label: "Owner",
        width: "14%",
        render: (item) => <UserChip user={item.ownerId ? ownerByUserId.get(item.ownerId) : null} />,
      },
      {
        id: "benchmark",
        label: "Benchmark",
        width: "10%",
        sortable: true,
        sortValue: (item) => (item.isBenchmark ? 1 : 0),
        render: (item) =>
          item.isBenchmark ? (
            <Chip label="Benchmark" color="success" size="small" variant="outlined" />
          ) : null,
      },
      {
        id: "primaryMovement",
        label: "Movement",
        width: "12%",
        sortable: true,
        sortValue: (item) => item.primaryMovement,
        render: (item) => (
          <Typography variant="body2">{formatToken(item.primaryMovement)}</Typography>
        ),
      },
      {
        id: "modality",
        label: "Modality",
        width: "10%",
        sortable: true,
        sortValue: (item) => item.modality,
        render: (item) => <Typography variant="body2">{formatToken(item.modality)}</Typography>,
      },
      {
        id: "skillLevel",
        label: "Level",
        width: "10%",
        sortable: true,
        sortValue: (item) => item.skillLevel,
        render: (item) => <Typography variant="body2">{formatToken(item.skillLevel)}</Typography>,
      },
      {
        id: "actions",
        label: "",
        align: "right",
        width: "10%",
        render: (item) => (
          <LibraryRowActions
            role={role}
            isOwn={isOwn(item)}
            scope={item.scope}
            onEdit={() => setEditTarget(item)}
            onDelete={() => requestDelete(item.id)}
            onPromote={() => promoteMutation.mutate(item.id)}
            onDemote={() => setDemoteTarget(item)}
          />
        ),
      },
    ],
    [isOwn, isPrivileged, ownerByUserId, promoteMutation, requestDelete, role],
  );

  const items = data?.items ?? [];

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error.message}</Alert>}

      <DataTable
        data={items}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search exercises..."
        paginated
        emptyMessage={isLoading ? "Loading exercises..." : "No exercises match your filters."}
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
        state={state}
        onStateChange={onStateChange}
      />

      <ExerciseFormModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <ExerciseFormModal
        open={!!editTarget}
        initial={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete exercise"
        message="Are you sure you want to delete this exercise?"
        details="This will soft-delete the row. Plans referencing it keep their snapshot, but new plans cannot reference it. This may affect existing plans."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />

      <DemoteDialog
        open={!!demoteTarget}
        itemName={demoteTarget?.name ?? ""}
        coaches={coaches ?? []}
        isPending={demoteMutation.isPending}
        onClose={() => setDemoteTarget(null)}
        onConfirm={handleDemoteConfirm}
      />
    </Stack>
  );
};
