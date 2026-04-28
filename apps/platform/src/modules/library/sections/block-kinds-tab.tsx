"use client";

import { useCallback, useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, ButtonBase, Chip, Stack, Typography } from "@mui/material";

import { type BlockKind } from "@repo/contracts/lms/block-kind";
import {
  type Column,
  DataTable,
  type DataTableFilter,
  UserChip,
  useDataTableUrlState,
} from "@repo/ui";

import { useBlockKindsPageData, usePlatformCoaches } from "@app/lib/hooks";

import { BlockKindFormModal } from "../components";
import { formatToken, SCOPE_CHIP_COLOR } from "../constants";

type BlockKindsTabProps = {
  currentUserId: string;
};

const SCOPE_FILTER_OPTIONS = [
  { value: "SYSTEM", label: "System" },
  { value: "COACH", label: "Coach (any)" },
  { value: "OWN", label: "Mine" },
];

export const BlockKindsTab = ({ currentUserId }: BlockKindsTabProps) => {
  const [editTarget, setEditTarget] = useState<BlockKind | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = useBlockKindsPageData({}, currentUserId);
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
    (item: BlockKind) => item.scope === "COACH" && item.ownerId === currentUserId,
    [currentUserId],
  );

  const filters: DataTableFilter<BlockKind>[] = useMemo(
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
    ],
    [isOwn],
  );

  const columns: Column<BlockKind>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "30%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => item.name,
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
        width: "12%",
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
        width: "20%",
        render: (item) => <UserChip user={item.ownerId ? ownerByUserId.get(item.ownerId) : null} />,
      },
      {
        id: "defaultWeight",
        label: "Weight",
        width: "10%",
        sortable: true,
        sortValue: (item) => item.defaultWeight,
        render: (item) => <Typography variant="body2">{item.defaultWeight}</Typography>,
      },
      {
        id: "defaultArchetypeKind",
        label: "Default archetype",
        width: "22%",
        sortable: true,
        sortValue: (item) => item.defaultArchetypeKind ?? "",
        render: (item) => (
          <Typography variant="body2">
            {item.defaultArchetypeKind ? formatToken(item.defaultArchetypeKind) : "—"}
          </Typography>
        ),
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
        searchPlaceholder="Search block kinds..."
        paginated
        emptyMessage={isLoading ? "Loading block kinds..." : "No block kinds match your filters."}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create block kind
          </Button>
        }
        state={state}
        onStateChange={onStateChange}
      />

      <BlockKindFormModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <BlockKindFormModal
        open={!!editTarget}
        initial={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
      />
    </Stack>
  );
};
