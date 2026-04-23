"use client";

import { useMemo } from "react";

import { Chip, Stack, Typography } from "@mui/material";

import { type BlockType } from "@repo/contracts/library/block-type";
import { useDeleteConfirmation } from "@repo/query";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteLibraryBlockType } from "@app/lib/hooks";

import { BlockTypeRowActions } from "../components";

const filters: DataTableFilter<BlockType>[] = [
  {
    id: "active",
    label: "Active",
    options: [
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
    match: (item, value) => String(item.active) === value,
  },
];

type BlockTypesListSectionProps = {
  blockTypes: BlockType[];
};

export const BlockTypesListSection = ({ blockTypes }: BlockTypesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "sortOrder", direction: "asc" },
  });

  const deleteMutation = useDeleteLibraryBlockType();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<BlockType>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "35%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => [item.name, item.slug].join(" "),
        render: (item) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{item.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {item.slug}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "iconKey",
        label: "Icon",
        width: "15%",
        sortable: true,
        sortValue: (item) => item.iconKey ?? "",
        render: (item) => (
          <Typography variant="body2" color="text.secondary">
            {item.iconKey ?? "—"}
          </Typography>
        ),
      },
      {
        id: "colorKey",
        label: "Color",
        width: "15%",
        sortable: true,
        sortValue: (item) => item.colorKey ?? "",
        render: (item) => (
          <Typography variant="body2" color="text.secondary">
            {item.colorKey ?? "—"}
          </Typography>
        ),
      },
      {
        id: "sortOrder",
        label: "Sort",
        width: "10%",
        align: "right",
        sortable: true,
        sortValue: (item) => item.sortOrder,
        render: (item) => (
          <Typography variant="body2" color="text.secondary">
            {item.sortOrder}
          </Typography>
        ),
      },
      {
        id: "active",
        label: "Active",
        width: "10%",
        sortable: true,
        sortValue: (item) => String(item.active),
        render: (item) =>
          item.active ? (
            <Chip label="Active" color="success" size="small" variant="outlined" />
          ) : (
            <Chip label="Inactive" size="small" variant="outlined" />
          ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "15%",
        render: (item) => <BlockTypeRowActions blockType={item} onDelete={requestDelete} />,
      },
    ],
    [requestDelete],
  );

  return (
    <>
      <DataTable
        data={blockTypes}
        columns={columns}
        searchPlaceholder="Search by name or slug..."
        filters={filters}
        action={<CreateButton href="/library/block-types/create">Create Block Type</CreateButton>}
        paginated
        emptyMessage="No block types found."
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Block Type"
        message="Are you sure you want to delete this block type?"
        details="Block types referenced by existing workouts cannot be deleted."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </>
  );
};
