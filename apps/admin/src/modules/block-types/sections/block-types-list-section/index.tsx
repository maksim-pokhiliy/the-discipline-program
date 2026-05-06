"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type BlockType } from "@repo/contracts/lms/block-type";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, useDataTableUrlState, type Column } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteBlockType } from "@app/lib/hooks";

const EMPTY_VALUE_PLACEHOLDER = "—";

type BlockTypesListSectionProps = {
  blockTypes: BlockType[];
};

export const BlockTypesListSection = ({ blockTypes }: BlockTypesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteBlockType();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<BlockType>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "30%",
        sortable: true,
        sortValue: (blockType) => blockType.name,
        searchValue: (blockType) => blockType.name,
        render: (blockType) => (
          <Typography variant="body2" fontWeight={500}>
            {blockType.name}
          </Typography>
        ),
      },
      {
        id: "description",
        label: "Description",
        width: "45%",
        render: (blockType) => (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {blockType.description ?? EMPTY_VALUE_PLACEHOLDER}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "15%",
        sortable: true,
        sortValue: (blockType) => new Date(blockType.createdAt).getTime(),
        render: (blockType) => (
          <Typography variant="body2">{formatDate(blockType.createdAt)}</Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        render: (blockType) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/block-types/${blockType.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => requestDelete(blockType.id)}
                color="error"
                aria-label="Delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [requestDelete],
  );

  return (
    <>
      <DataTable
        data={blockTypes}
        columns={columns}
        searchPlaceholder="Search block types..."
        action={<CreateButton href="/block-types/create">Create Block Type</CreateButton>}
        paginated
        emptyMessage="No block types found. Add your first block type!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Block Type"
        message="Are you sure you want to delete this block type?"
        details="This action cannot be undone."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </>
  );
};
