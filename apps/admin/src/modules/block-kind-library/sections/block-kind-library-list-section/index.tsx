"use client";

import { useCallback, useMemo, useState } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { useDeleteConfirmation } from "@repo/query";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteBlockKind } from "@app/lib/hooks";

import {
  formatToken,
  LIBRARY_SCOPE_OPTIONS,
  SCHEME_ARCHETYPE_KIND_OPTIONS,
  SCOPE_CHIP_COLOR,
} from "../../constants";
import { PromoteDemoteSection } from "../promote-demote-section";

const filters: DataTableFilter<BlockKind>[] = [
  {
    id: "scope",
    label: "Scope",
    options: LIBRARY_SCOPE_OPTIONS,
    match: (item, value) => item.scope === value,
  },
  {
    id: "defaultArchetypeKind",
    label: "Default archetype",
    options: SCHEME_ARCHETYPE_KIND_OPTIONS,
    match: (item, value) => item.defaultArchetypeKind === value,
  },
];

type PromoteState = { blockKind: BlockKind } | null;
type DemoteState = { blockKind: BlockKind } | null;

type BlockKindLibraryListSectionProps = {
  items: BlockKind[];
};

export const BlockKindLibraryListSection = ({ items }: BlockKindLibraryListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "name", direction: "asc" },
  });
  const deleteMutation = useDeleteBlockKind();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });
  const [promoteTarget, setPromoteTarget] = useState<PromoteState>(null);
  const [demoteTarget, setDemoteTarget] = useState<DemoteState>(null);

  const handlePromoteRequest = useCallback((blockKind: BlockKind) => {
    setPromoteTarget({ blockKind });
  }, []);

  const handleDemoteRequest = useCallback((blockKind: BlockKind) => {
    setDemoteTarget({ blockKind });
  }, []);

  const closePromoteDemote = useCallback(() => {
    setPromoteTarget(null);
    setDemoteTarget(null);
  }, []);

  const columns: Column<BlockKind>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "30%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => item.name,
        render: (item) => <Typography variant="subtitle2">{item.name}</Typography>,
      },
      {
        id: "scope",
        label: "Scope",
        width: "12%",
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
        render: (item) => (
          <Typography variant="body2" color="text.secondary">
            {item.ownerId ?? "—"}
          </Typography>
        ),
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
        width: "15%",
        sortable: true,
        sortValue: (item) => item.defaultArchetypeKind ?? "",
        render: (item) => (
          <Typography variant="body2">
            {item.defaultArchetypeKind ? formatToken(item.defaultArchetypeKind) : "—"}
          </Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "15%",
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
                href={`/library/block-kinds/${item.id}`}
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
    [handleDemoteRequest, handlePromoteRequest, requestDelete],
  );

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search by name..."
        filters={filters}
        action={<CreateButton href="/library/block-kinds/create">Create block kind</CreateButton>}
        paginated
        emptyMessage="No block kinds yet."
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete block kind"
        message="Are you sure you want to delete this block kind?"
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
