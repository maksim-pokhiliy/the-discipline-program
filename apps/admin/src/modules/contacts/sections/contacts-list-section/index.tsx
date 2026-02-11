"use client";

import { useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Chip, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type GetContactByIdResponse, CONTACT_STATUSES } from "@repo/contracts/contact";
import { ConfirmationModal, DataTable, type Column, PanelSection } from "@repo/ui";

import { useDeleteContact, useUpdateContact } from "@app/lib/hooks";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: "info" | "warning" | "success" | "default" }
> = {
  NEW: { label: "New", color: "info" },
  IN_PROGRESS: { label: "In Progress", color: "warning" },
  REPLIED: { label: "Replied", color: "success" },
  CLOSED: { label: "Closed", color: "default" },
};

interface ContactsListSectionProps {
  contacts: GetContactByIdResponse[];
}

export const ContactsListSection = ({ contacts }: ContactsListSectionProps) => {
  const { mutate: deleteContact, isPending: isDeleting } = useDeleteContact();
  const { mutate: updateContact } = useUpdateContact();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

  const handleStatusSelect = (status: (typeof CONTACT_STATUSES)[number]) => {
    if (statusMenuContactId) {
      setUpdatingId(statusMenuContactId);
      updateContact(
        { id: statusMenuContactId, data: { status } },
        { onSettled: () => setUpdatingId(null) },
      );
    }

    handleStatusMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteContact(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: Column<GetContactByIdResponse>[] = [
    {
      id: "contact",
      label: "Contact",
      width: "25%",
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
            disabled={updatingId === item.id}
          />
        );
      },
    },
    {
      id: "createdAt",
      label: "Date",
      width: "10%",
      render: (item) => <Typography variant="body2">{formatDate(item.createdAt)}</Typography>,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (item) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton component={Link} href={`/contacts/${item.id}`} size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => setDeleteId(item.id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PanelSection title="All Submissions">
        <DataTable data={contacts} columns={columns} emptyMessage="No contact submissions found." />
      </PanelSection>

      <Menu anchorEl={statusMenuAnchor} open={!!statusMenuAnchor} onClose={handleStatusMenuClose}>
        {CONTACT_STATUSES.map((status) => {
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
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
};
