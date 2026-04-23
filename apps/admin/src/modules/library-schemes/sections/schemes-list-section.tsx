"use client";

import { useMemo } from "react";

import { Chip, Stack, Typography } from "@mui/material";

import { SCHEME_KIND_LABELS, type Scheme } from "@repo/contracts/library/scheme";
import { useDeleteConfirmation } from "@repo/query";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteLibraryScheme } from "@app/lib/hooks";

import { SchemeRowActions } from "../components";

const filters: DataTableFilter<Scheme>[] = [
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

type SchemesListSectionProps = {
  schemes: Scheme[];
};

export const SchemesListSection = ({ schemes }: SchemesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "sortOrder", direction: "asc" },
  });

  const deleteMutation = useDeleteLibraryScheme();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<Scheme>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "30%",
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
        id: "kind",
        label: "Kind",
        width: "20%",
        sortable: true,
        sortValue: (item) => item.kind,
        render: (item) => (
          <Chip label={SCHEME_KIND_LABELS[item.kind]} size="small" variant="outlined" />
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
        width: "15%",
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
        render: (item) => <SchemeRowActions scheme={item} onDelete={requestDelete} />,
      },
    ],
    [requestDelete],
  );

  return (
    <>
      <DataTable
        data={schemes}
        columns={columns}
        searchPlaceholder="Search by name or slug..."
        filters={filters}
        action={<CreateButton href="/library/schemes/create">Create Scheme</CreateButton>}
        paginated
        emptyMessage="No schemes found."
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Scheme"
        message="Are you sure you want to delete this scheme?"
        details="Schemes referenced by existing workouts cannot be deleted."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </>
  );
};
