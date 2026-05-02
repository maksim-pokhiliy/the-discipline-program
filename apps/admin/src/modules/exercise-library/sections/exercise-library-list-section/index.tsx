"use client";

import { useCallback, useMemo, useState } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, IconButton, Stack, Switch, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type CoachListItem } from "@repo/contracts/iam/user";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { useDeleteConfirmation } from "@repo/query";
import {
  ConfirmationModal,
  DataTable,
  UserChip,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useCoachesList, useDeleteExercise, useUpdateExercise } from "@app/lib/hooks";

import {
  formatToken,
  LIBRARY_SCOPE_OPTIONS,
  MODALITY_OPTIONS,
  MOVEMENT_PATTERN_OPTIONS,
  SCOPE_CHIP_COLOR,
} from "../../constants";
import { PromoteDemoteSection } from "../promote-demote-section";

const filters: DataTableFilter<ExerciseLibraryItem>[] = [
  {
    id: "scope",
    label: "Scope",
    options: LIBRARY_SCOPE_OPTIONS,
    match: (item, value) => item.scope === value,
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
];

type PromoteState = { exercise: ExerciseLibraryItem } | null;
type DemoteState = { exercise: ExerciseLibraryItem } | null;

type ExerciseLibraryListSectionProps = {
  items: ExerciseLibraryItem[];
};

export const ExerciseLibraryListSection = ({ items }: ExerciseLibraryListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "name", direction: "asc" },
  });
  const deleteMutation = useDeleteExercise();
  const updateMutation = useUpdateExercise();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });
  const [promoteTarget, setPromoteTarget] = useState<PromoteState>(null);
  const [demoteTarget, setDemoteTarget] = useState<DemoteState>(null);
  const { data: coaches } = useCoachesList();

  const coachById = useMemo(() => {
    const map = new Map<string, CoachListItem>();

    for (const coach of coaches ?? []) {
      map.set(coach.userId, coach);
    }

    return map;
  }, [coaches]);

  const handlePromoteRequest = useCallback((exercise: ExerciseLibraryItem) => {
    setPromoteTarget({ exercise });
  }, []);

  const handleDemoteRequest = useCallback((exercise: ExerciseLibraryItem) => {
    setDemoteTarget({ exercise });
  }, []);

  const closePromoteDemote = useCallback(() => {
    setPromoteTarget(null);
    setDemoteTarget(null);
  }, []);

  const handleDeprecatedToggle = useCallback(
    (exercise: ExerciseLibraryItem) => {
      updateMutation.mutate({
        id: exercise.id,
        data: { isDeprecated: !exercise.isDeprecated },
      });
    },
    [updateMutation],
  );

  const columns: Column<ExerciseLibraryItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "25%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => `${item.name} ${item.nameAliases.join(" ")}`,
        render: (item) => <Typography variant="subtitle2">{item.name}</Typography>,
      },
      {
        id: "scope",
        label: "Scope",
        width: "10%",
        sortable: true,
        sortValue: (item) => item.scope,
        render: (item) => (
          <Chip
            label={item.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[item.scope]}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "owner",
        label: "Owner",
        width: "18%",
        render: (item) => {
          if (!item.ownerId) {
            return (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            );
          }

          const coach = coachById.get(item.ownerId);

          return (
            <UserChip
              user={
                coach
                  ? { id: coach.userId, name: coach.name, email: coach.email }
                  : { id: item.ownerId }
              }
            />
          );
        },
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
        width: "8%",
        sortable: true,
        sortValue: (item) => item.modality,
        render: (item) => <Typography variant="body2">{formatToken(item.modality)}</Typography>,
      },
      {
        id: "benchmark",
        label: "Benchmark",
        width: "8%",
        sortable: true,
        sortValue: (item) => (item.isBenchmark ? 1 : 0),
        render: (item) =>
          item.isBenchmark ? (
            <Chip label="Benchmark" color="success" size="small" variant="outlined" />
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          ),
      },
      {
        id: "deprecated",
        label: "Deprecated",
        width: "10%",
        sortable: true,
        sortValue: (item) => (item.isDeprecated ? 1 : 0),
        render: (item) => {
          const isToggling = updateMutation.isPending && updateMutation.variables?.id === item.id;

          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <Switch
                size="small"
                checked={item.isDeprecated}
                disabled={isToggling}
                onChange={() => handleDeprecatedToggle(item)}
                color="warning"
                inputProps={{ "aria-label": "Toggle deprecated status" }}
              />
              {item.isDeprecated && (
                <Chip label="Deprecated" color="default" size="small" variant="outlined" />
              )}
            </Stack>
          );
        },
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "9%",
        render: (item) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {item.scope === "COACH" ? (
              <Tooltip title="Promote to SYSTEM">
                <IconButton
                  onClick={() => handlePromoteRequest(item)}
                  color="primary"
                  aria-label="Promote"
                  size="small"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Demote to COACH">
                <IconButton
                  onClick={() => handleDemoteRequest(item)}
                  color="warning"
                  aria-label="Demote"
                  size="small"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/library/exercises/${item.id}`}
                color="primary"
                aria-label="Edit"
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton
                onClick={() => requestDelete(item.id)}
                color="error"
                aria-label="Delete"
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [
      coachById,
      handleDemoteRequest,
      handleDeprecatedToggle,
      handlePromoteRequest,
      requestDelete,
      updateMutation.isPending,
      updateMutation.variables?.id,
    ],
  );

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search by name or alias..."
        filters={filters}
        action={<CreateButton href="/library/exercises/create">Create exercise</CreateButton>}
        paginated
        emptyMessage="No exercises yet."
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete exercise"
        message="Are you sure you want to delete this exercise?"
        details="This will soft-delete the row. Plans referencing it keep their snapshot."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />

      <PromoteDemoteSection
        promoteTarget={promoteTarget}
        demoteTarget={demoteTarget}
        onClose={closePromoteDemote}
      />
    </>
  );
};
