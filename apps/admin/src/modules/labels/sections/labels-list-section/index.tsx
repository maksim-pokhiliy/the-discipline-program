"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { APP_LEVELS, type Label } from "@repo/contracts/lms/label";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import {
  ConfirmationModal,
  DataTable,
  IndicatorChip,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteLabel } from "@app/lib/hooks";

import { APP_LEVEL_LABELS } from "../../constants";

const filters: DataTableFilter<Label>[] = [
  {
    id: "applicableLevels",
    label: "Applicable Level",
    options: APP_LEVELS.map((value) => ({ value, label: APP_LEVEL_LABELS[value] })),
    match: (label, value) => (label.applicableLevels ?? []).some((level) => level === value),
  },
];

type LabelsListSectionProps = {
  labels: Label[];
};

export const LabelsListSection = ({ labels }: LabelsListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteLabel();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<Label>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "30%",
        sortable: true,
        sortValue: (label) => label.name,
        searchValue: (label) => label.name,
        render: (label) => (
          <Typography
            component={Link}
            href={`/labels/${label.id}`}
            variant="subtitle2"
            color="primary"
            sx={{ textDecoration: "none" }}
          >
            {label.name}
          </Typography>
        ),
      },
      {
        id: "applicableLevels",
        label: "Applicable Levels",
        width: "25%",
        render: (label) => (
          <Stack direction="row" spacing={1}>
            {label.applicableLevels.map((level) => (
              <Chip key={level} label={APP_LEVEL_LABELS[level]} size="small" variant="outlined" />
            ))}
          </Stack>
        ),
      },
      {
        id: "rest",
        label: "Rest",
        width: "10%",
        render: (label) =>
          label.rest === true ? <IndicatorChip tone="info" label="REST" /> : null,
      },
      {
        id: "createdAt",
        label: "Created",
        width: "10%",
        sortable: true,
        sortValue: (label) => new Date(label.createdAt).getTime(),
        render: (label) => <Typography variant="body2">{formatDate(label.createdAt)}</Typography>,
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "15%",
        render: (label) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/labels/${label.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton onClick={() => requestDelete(label.id)} color="error" aria-label="Delete">
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
        data={labels}
        columns={columns}
        searchPlaceholder="Search by name"
        filters={filters}
        action={<CreateButton href="/labels/create">Create Label</CreateButton>}
        paginated
        emptyMessage="No labels yet. Create the first one!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Label"
        message="Are you sure you want to delete this label?"
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
