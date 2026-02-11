"use client";

import { useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  type ContactStats,
  type GetContactByIdResponse,
  CONTACT_STATUSES,
} from "@repo/contracts/contact";
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

const FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  ...CONTACT_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s]?.label || s })),
] as const;

interface ContactsListSectionProps {
  contacts: GetContactByIdResponse[];
  stats: ContactStats;
}

export const ContactsListSection = ({ contacts, stats }: ContactsListSectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("filters.status") || "ALL";

  const { mutate: deleteContact, isPending: isDeleting } = useDeleteContact();
  const { mutate: updateContact } = useUpdateContact();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredContacts =
    statusFilter === "ALL" ? contacts : contacts.filter((c) => c.status === statusFilter);

  const handleFilterChange = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (!value) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (value === "ALL") {
      params.delete("filters.status");
    } else {
      params.set("filters.status", value);
    }

    const query = params.toString();

    router.push(query ? `/contacts?${query}` : "/contacts");
  };

  const handleStatusChange = (id: string, event: SelectChangeEvent<string>) => {
    setUpdatingId(id);
    updateContact(
      { id, data: { status: event.target.value as (typeof CONTACT_STATUSES)[number] } },
      { onSettled: () => setUpdatingId(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteContact(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const getCount = (value: string) => {
    if (value === "ALL") {
      return stats.total;
    }

    if (value === "NEW") {
      return stats.new;
    }

    if (value === "IN_PROGRESS") {
      return stats.inProgress;
    }

    if (value === "REPLIED") {
      return stats.replied;
    }

    if (value === "CLOSED") {
      return stats.closed;
    }

    return 0;
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
      width: "15%",
      render: (item) => (
        <Select
          value={item.status}
          onChange={(e) => handleStatusChange(item.id, e)}
          size="small"
          variant="standard"
          disabled={updatingId === item.id}
          sx={{ minWidth: 110, fontSize: "0.875rem" }}
        >
          {CONTACT_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_CONFIG[status]?.label || status}
            </MenuItem>
          ))}
        </Select>
      ),
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
          <Tooltip title="View Details">
            <IconButton component={Link} href={`/contacts/${item.id}`} size="small" color="primary">
              <VisibilityIcon fontSize="small" />
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
        <Stack spacing={2}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={handleFilterChange}
            size="small"
          >
            {FILTER_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label} ({getCount(opt.value)})
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <DataTable
            data={filteredContacts}
            columns={columns}
            emptyMessage="No contact submissions found."
          />
        </Stack>
      </PanelSection>

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
