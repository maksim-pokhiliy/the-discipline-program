"use client";

import VisibilityIcon from "@mui/icons-material/Visibility";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { USER_ROLES } from "@repo/contracts/auth";
import { type AdminUserListItem } from "@repo/contracts/user";
import { formatDate } from "@repo/shared";
import { DataTable, type Column, type DataTableFilter } from "@repo/ui";

import { ROLE_CONFIG } from "../../constants";

interface UsersListSectionProps {
  users: AdminUserListItem[];
}

export const UsersListSection = ({ users }: UsersListSectionProps) => {
  const filters: DataTableFilter<AdminUserListItem>[] = [
    {
      id: "role",
      label: "Role",
      options: USER_ROLES.map((role) => ({
        label: ROLE_CONFIG[role]?.label || role,
        value: role,
      })),
      match: (item, value) => item.role === value,
    },
  ];

  const columns: Column<AdminUserListItem>[] = [
    {
      id: "email",
      label: "Email",
      width: "45%",
      sortable: true,
      sortValue: (user) => user.email,
      searchValue: (user) => user.email,
      render: (user) => (
        <Typography variant="subtitle2" fontWeight={600}>
          {user.email}
        </Typography>
      ),
    },
    {
      id: "role",
      label: "Role",
      width: "20%",
      sortable: true,
      sortValue: (user) => user.role,
      render: (user) => {
        const config = ROLE_CONFIG[user.role] || { label: user.role, color: "default" as const };

        return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
      },
    },
    {
      id: "createdAt",
      label: "Registered",
      width: "20%",
      sortable: true,
      sortValue: (user) => new Date(user.createdAt).getTime(),
      render: (user) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(user.createdAt)}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      width: "15%",
      render: (user) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          <Tooltip title="View">
            <IconButton component={Link} href={`/users/${user.id}`} size="small" color="primary">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      title="Users"
      searchPlaceholder="Search by email..."
      filters={filters}
      paginated
      emptyMessage="No users found."
    />
  );
};
