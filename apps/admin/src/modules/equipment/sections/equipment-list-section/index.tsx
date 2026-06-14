"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type Equipment } from "@repo/contracts/lms/equipment";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, useDataTableUrlState, type Column } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteEquipment } from "@app/lib/hooks";

type EquipmentListSectionProps = {
  equipment: Equipment[];
};

export const EquipmentListSection = ({ equipment }: EquipmentListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteEquipment();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<Equipment>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "35%",
        sortable: true,
        sortValue: (item) => item.name,
        searchValue: (item) => item.name,
        render: (item) => (
          <Typography
            component={Link}
            href={`/equipment/${item.id}`}
            variant="subtitle2"
            color="primary"
            sx={{ textDecoration: "none" }}
          >
            {item.name}
          </Typography>
        ),
      },
      {
        id: "notes",
        label: "Notes",
        width: "40%",
        render: (item) => (
          <Typography variant="body2" color="text.secondary">
            {item.notes ?? "—"}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "10%",
        sortable: true,
        sortValue: (item) => new Date(item.createdAt).getTime(),
        render: (item) => <Typography variant="body2">{formatDate(item.createdAt)}</Typography>,
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "15%",
        render: (item) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/equipment/${item.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton onClick={() => requestDelete(item.id)} color="error" aria-label="Delete">
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
        data={equipment}
        columns={columns}
        searchPlaceholder="Search by name"
        action={<CreateButton href="/equipment/create">Create Equipment</CreateButton>}
        paginated
        emptyMessage="No equipment yet. Create the first one!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Equipment"
        message="Are you sure you want to delete this equipment?"
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
