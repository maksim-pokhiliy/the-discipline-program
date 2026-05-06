"use client";

import { useMemo } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type DayType } from "@repo/contracts/lms/day-type";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, useDataTableUrlState, type Column } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteDayType } from "@app/lib/hooks";

const SWATCH_SIZE = 20;

type DayTypesListSectionProps = {
  dayTypes: DayType[];
};

export const DayTypesListSection = ({ dayTypes }: DayTypesListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteDayType();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<DayType>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "40%",
        sortable: true,
        sortValue: (dayType) => dayType.name,
        searchValue: (dayType) => dayType.name,
        render: (dayType) => (
          <Typography variant="body2" fontWeight={500}>
            {dayType.name}
          </Typography>
        ),
      },
      {
        id: "color",
        label: "Color",
        width: "30%",
        render: (dayType) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                bgcolor: dayType.color,
                border: 1,
                borderColor: "divider",
                borderRadius: 0.5,
                flexShrink: 0,
              }}
              aria-label={`Color ${dayType.color}`}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              {dayType.color}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "createdAt",
        label: "Created",
        width: "20%",
        sortable: true,
        sortValue: (dayType) => new Date(dayType.createdAt).getTime(),
        render: (dayType) => (
          <Typography variant="body2">{formatDate(dayType.createdAt)}</Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        render: (dayType) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/day-types/${dayType.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => requestDelete(dayType.id)}
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
        data={dayTypes}
        columns={columns}
        searchPlaceholder="Search day types..."
        action={<CreateButton href="/day-types/create">Create Day Type</CreateButton>}
        paginated
        emptyMessage="No day types found. Add your first day type!"
        state={state}
        onStateChange={onStateChange}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Day Type"
        message="Are you sure you want to delete this day type?"
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
