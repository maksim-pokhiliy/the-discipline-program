"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { SCHEME_ARCHETYPE_KIND_LABELS } from "@repo/contracts/lms/_domain";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, useDataTableUrlState, type Column } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteSchemeType } from "@app/lib/hooks";

type SchemeTypesListSectionProps = {
  schemeTypes: SchemeType[];
};

export const SchemeTypesListSection = ({ schemeTypes }: SchemeTypesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteSchemeType();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<SchemeType>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "45%",
        sortable: true,
        sortValue: (schemeType) => schemeType.name,
        searchValue: (schemeType) => schemeType.name,
        render: (schemeType) => (
          <Typography variant="body2" fontWeight={500}>
            {schemeType.name}
          </Typography>
        ),
      },
      {
        id: "archetypeKind",
        label: "Archetype",
        width: "25%",
        render: (schemeType) => (
          <Typography variant="body2">
            {SCHEME_ARCHETYPE_KIND_LABELS[schemeType.archetypeKind]}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "15%",
        sortable: true,
        sortValue: (schemeType) => new Date(schemeType.createdAt).getTime(),
        render: (schemeType) => (
          <Typography variant="body2">{formatDate(schemeType.createdAt)}</Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        render: (schemeType) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/scheme-types/${schemeType.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => requestDelete(schemeType.id)}
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
        data={schemeTypes}
        columns={columns}
        searchPlaceholder="Search scheme types..."
        action={<CreateButton href="/scheme-types/create">Create Scheme Type</CreateButton>}
        paginated
        emptyMessage="No scheme types found. Add your first scheme type!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Scheme Type"
        message="Are you sure you want to delete this scheme type?"
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
