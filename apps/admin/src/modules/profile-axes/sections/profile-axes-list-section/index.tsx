"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, useDataTableUrlState, type Column } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteProfileAxis } from "@app/lib/hooks";

type ProfileAxesListSectionProps = {
  profileAxes: ProfileAxis[];
};

export const ProfileAxesListSection = ({ profileAxes }: ProfileAxesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteProfileAxis();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<ProfileAxis>[] = useMemo(
    () => [
      {
        id: "key",
        label: "Key",
        width: "25%",
        sortable: true,
        sortValue: (axis) => axis.key,
        searchValue: (axis) => axis.key,
        render: (axis) => (
          <Typography
            component={Link}
            href={`/profile-axes/${axis.id}`}
            variant="subtitle2"
            color="primary"
            sx={{ textDecoration: "none" }}
          >
            {axis.key}
          </Typography>
        ),
      },
      {
        id: "label",
        label: "Label",
        width: "20%",
        sortable: true,
        sortValue: (axis) => axis.label,
        searchValue: (axis) => axis.label,
        render: (axis) => <Typography variant="body2">{axis.label}</Typography>,
      },
      {
        id: "values",
        label: "Values",
        width: "30%",
        render: (axis) => (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {axis.values.map((value) => (
              <Chip key={value} label={value} size="small" variant="outlined" />
            ))}
          </Stack>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "10%",
        sortable: true,
        sortValue: (axis) => new Date(axis.createdAt).getTime(),
        render: (axis) => <Typography variant="body2">{formatDate(axis.createdAt)}</Typography>,
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "15%",
        render: (axis) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/profile-axes/${axis.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton onClick={() => requestDelete(axis.id)} color="error" aria-label="Delete">
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
        data={profileAxes}
        columns={columns}
        searchPlaceholder="Search by key or label"
        action={<CreateButton href="/profile-axes/create">Create Profile Axis</CreateButton>}
        paginated
        emptyMessage="No profile axes yet. Create the first one!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Profile Axis"
        message="Are you sure you want to delete this profile axis?"
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
