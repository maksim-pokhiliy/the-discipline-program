"use client";

import { useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Chip, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { type ChipProps } from "@mui/material";
import Link from "next/link";

import { type GetContactByIdResponse, ContactStatus } from "@repo/contracts/contact";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, type Column, type DataTableFilter } from "@repo/ui";

import { useDeleteContact, useUpdateContact } from "@app/lib/hooks";

const STATUS_CONFIG: Record<string, { label: string; color: ChipProps["color"] }> = {
  NEW: { label: "New", color: "info" },
  IN_PROGRESS: { label: "In Progress", color: "warning" },
  REPLIED: { label: "Replied", color: "success" },
  CLOSED: { label: "Closed", color: "default" },
};

const filters: DataTableFilter<GetContactByIdResponse>[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { label: "New", value: "NEW" },
      { label: "In Progress", value: "IN_PROGRESS" },
      { label: "Replied", value: "REPLIED" },
      { label: "Closed", value: "CLOSED" },
    ],
    match: (item, value) => item.status === value,
  },
];

interface ContactsListSectionProps {
  contacts: GetContactByIdResponse[];
}

export const ContactsListSection = ({ contacts }: ContactsListSectionProps) => {
  const deleteMutation = useDeleteContact();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });
  const updateContactMutation = useUpdateContact();

  const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null);
  const [statusMenuContactId, setStatusMenuContactId] = useState<string | null>(null);

  const handleStatusChipClick = (event: React.MouseEvent<HTMLElement>, contactId: string) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuContactId(contactId);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setStatusMenuContactId(null);
  };

  const handleStatusSelect = (status: ContactStatus) => {
    if (statusMenuContactId) {
      updateContactMutation.mutate({ id: statusMenuContactId, data: { status } });
    }

    handleStatusMenuClose();
  };

  const columns: Column<GetContactByIdResponse>[] = [
    {
      id: "contact",
      label: "Contact",
      width: "25%",
      searchValue: (item) => `${item.name || ""} ${item.email || ""}`,
      render: (item) => (
        <Box>
          <Typography variant="subtitle2">{item.name || "Anonymous"}</Typography>
          {item.email && (
            <Typography variant="caption" color="text.secondary">
              {item.email}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: "program",
      label: "Program",
      width: "15%",
      render: (item) => (
        <Typography variant="body2" color="text.secondary">
          {item.program || "—"}
        </Typography>
      ),
    },
    {
      id: "message",
      label: "Message",
      width: "25%",
      render: (item) => (
        <Tooltip title={item.message}>
          <Typography
            variant="body2"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.message}
          </Typography>
        </Tooltip>
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "12%",
      render: (item) => {
        const config = STATUS_CONFIG[item.status] || {
          label: item.status,
          color: "default" as const,
        };

        return (
          <Chip
            label={config.label}
            color={config.color}
            size="small"
            variant="outlined"
            onClick={(e) => handleStatusChipClick(e, item.id)}
            disabled={
              updateContactMutation.isPending && updateContactMutation.variables?.id === item.id
            }
          />
        );
      },
    },
    {
      id: "createdAt",
      label: "Date",
      width: "10%",
      sortable: true,
      sortValue: (item) => new Date(item.createdAt).getTime(),
      render: (item) => <Typography variant="body2">{formatDate(item.createdAt)}</Typography>,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (item) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton component={Link} href={`/contacts/${item.id}`} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => requestDelete(item.id)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={contacts}
        columns={columns}
        title="Submissions"
        searchPlaceholder="Search by name or email..."
        filters={filters}
        paginated
        emptyMessage="No contact submissions found."
      />

      <Menu anchorEl={statusMenuAnchor} open={!!statusMenuAnchor} onClose={handleStatusMenuClose}>
        {Object.values(ContactStatus).map((status) => {
          const currentContact = contacts.find((c) => c.id === statusMenuContactId);

          return (
            <MenuItem
              key={status}
              onClick={() => handleStatusSelect(status)}
              selected={currentContact?.status === status}
            >
              {STATUS_CONFIG[status]?.label || status}
            </MenuItem>
          );
        })}
      </Menu>

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Submission"
        message="Are you sure you want to delete this contact submission?"
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
