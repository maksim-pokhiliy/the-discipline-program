"use client";

import { useCallback, useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, ButtonBase, Chip, Stack, Typography } from "@mui/material";

import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import {
  type Column,
  DataTable,
  type DataTableFilter,
  UserChip,
  useDataTableUrlState,
} from "@repo/ui";

import { useExercisesPageData, usePlatformCoaches } from "@app/lib/hooks";

import { ExerciseFormModal } from "../components";
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
  const [editTarget, setEditTarget] = useState<ExerciseLibraryItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = useExercisesPageData({}, currentUserId);
  const { data: coaches } = usePlatformCoaches();

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

  const columns: Column<ExerciseLibraryItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "26%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => `${item.name} ${item.nameAliases.join(" ")}`,
        render: (item) =>
          isOwn(item) ? (
            <ButtonBase
              onClick={() => setEditTarget(item)}
              sx={{ textAlign: "left", justifyContent: "flex-start", width: "100%" }}
            >
              <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
                {item.name}
              </Typography>
            </ButtonBase>
          ) : (
            <Typography variant="subtitle2">{item.name}</Typography>
          ),
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
        width: "16%",
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
        width: "14%",
        sortable: true,
        sortValue: (item) => item.primaryMovement,
        render: (item) => (
          <Typography variant="body2">{formatToken(item.primaryMovement)}</Typography>
        ),
      },
      {
        id: "modality",
        label: "Modality",
        width: "12%",
        sortable: true,
        sortValue: (item) => item.modality,
        render: (item) => <Typography variant="body2">{formatToken(item.modality)}</Typography>,
      },
      {
        id: "skillLevel",
        label: "Level",
        width: "12%",
        sortable: true,
        sortValue: (item) => item.skillLevel,
        render: (item) => <Typography variant="body2">{formatToken(item.skillLevel)}</Typography>,
      },
    ],
    [isOwn, ownerByUserId],
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
    </Stack>
  );
};
