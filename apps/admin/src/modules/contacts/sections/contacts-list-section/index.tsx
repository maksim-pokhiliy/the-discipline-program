"use client";

import { useCallback, useMemo, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Chip, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type GetContactByIdResponse, ContactStatus } from "@repo/contracts/contact";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { useDeleteContact, useUpdateContact } from "@app/lib/hooks";
import { TEXT_CLAMP_SX } from "@app/lib/styles/text-clamp";

import { CONTACT_STATUS_CONFIG } from "../../constants";

const filters: DataTableFilter<GetContactByIdResponse>[] = [
  {
    id: "status",
    label: "Status",
    options: Object.values(ContactStatus).map((status) => ({
      label: CONTACT_STATUS_CONFIG[status].label,
      value: status,
    })),
    match: (item, value) => item.status === value,
  },
];

type ContactsListSectionProps = {
  contacts: GetContactByIdResponse[];
};

export const ContactsListSection = ({ contacts }: ContactsListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState();
  const deleteMutation = useDeleteContact();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });
  const updateContactMutation = useUpdateContact();

  const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null);
  const [statusMenuContactId, setStatusMenuContactId] = useState<string | null>(null);

  const handleStatusChipClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, contactId: string) => {
      event.stopPropagation();
      setStatusMenuAnchor(event.currentTarget);
      setStatusMenuContactId(contactId);
    },
    [],
  );

  const handleStatusMenuClose = useCallback(() => {
    setStatusMenuAnchor(null);
    setStatusMenuContactId(null);
  }, []);

  const handleStatusSelect = useCallback(
    (status: ContactStatus) => {
      if (statusMenuContactId) {
        updateContactMutation.mutate({ id: statusMenuContactId, data: { status } });
      }

      handleStatusMenuClose();
    },
    [statusMenuContactId, updateContactMutation, handleStatusMenuClose],
  );

  const menuContact = useMemo(
    () => contacts.find((c) => c.id === statusMenuContactId),
    [contacts, statusMenuContactId],
  );

  const columns: Column<GetContactByIdResponse>[] = useMemo(
    () => [
      {
        id: "contact",
        label: "Contact",
        width: "25%",
        searchValue: (item) => `${item.name || ""} ${item.contact || ""}`,
        render: (item) => (
          <Box>
            <Typography variant="subtitle2">{item.name || "Anonymous"}</Typography>
            {item.contact && (
              <Typography variant="caption" color="text.secondary">
                {item.contact}
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
            <Typography variant="body2" sx={TEXT_CLAMP_SX}>
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
          const config = CONTACT_STATUS_CONFIG[item.status];

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
    ],
    [handleStatusChipClick, updateContactMutation, requestDelete],
  );

  return (
    <>
      <DataTable
        data={contacts}
        columns={columns}
        searchPlaceholder="Search by name or email..."
        filters={filters}
        paginated
        emptyMessage="No contact submissions found."
        state={state}
        onStateChange={onStateChange}
      />

      <Menu anchorEl={statusMenuAnchor} open={!!statusMenuAnchor} onClose={handleStatusMenuClose}>
        {Object.values(ContactStatus).map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusSelect(status)}
            selected={menuContact?.status === status}
          >
            {CONTACT_STATUS_CONFIG[status].label}
          </MenuItem>
        ))}
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
