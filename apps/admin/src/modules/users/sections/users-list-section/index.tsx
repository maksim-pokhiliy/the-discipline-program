"use client";

import { useCallback, useMemo, useState } from "react";

import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { UserRole } from "@repo/contracts/auth";
import { type AdminUserListItem } from "@repo/contracts/user";
import { formatDate } from "@repo/shared";
import {
  ConfirmationModal,
  DataTable,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { useUpdateUserRole } from "@app/lib/hooks";

import { ROLE_CONFIG } from "../../constants";

const filters: DataTableFilter<AdminUserListItem>[] = [
  {
    id: "role",
    label: "Role",
    options: Object.values(UserRole).map((role) => ({
      label: ROLE_CONFIG[role].label,
      value: role,
    })),
    match: (item, value) => item.role === value,
  },
];

interface UsersListSectionProps {
  users: AdminUserListItem[];
}

export const UsersListSection = ({ users }: UsersListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "createdAt", direction: "desc" },
  });
  const { mutate: updateRole, isPending } = useUpdateUserRole();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    currentRole: UserRole;
    newRole: UserRole;
  } | null>(null);

  const handleChipClick = useCallback((event: React.MouseEvent<HTMLElement>, userId: string) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuUserId(userId);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuUserId(null);
  }, []);

  const handleRoleSelect = useCallback(
    (newRole: UserRole) => {
      const currentUser = users.find((u) => u.id === menuUserId);

      handleMenuClose();

      if (!currentUser || currentUser.role === newRole) {
        return;
      }

      setPendingChange({
        userId: currentUser.id,
        currentRole: currentUser.role,
        newRole,
      });
    },
    [users, menuUserId, handleMenuClose],
  );

  const menuUser = useMemo(() => users.find((u) => u.id === menuUserId), [users, menuUserId]);

  const handleConfirm = () => {
    if (pendingChange) {
      updateRole(
        { id: pendingChange.userId, data: { role: pendingChange.newRole } },
        { onSettled: () => setPendingChange(null) },
      );
    }
  };

  const columns: Column<AdminUserListItem>[] = useMemo(
    () => [
      {
        id: "email",
        label: "Email",
        width: "45%",
        sortable: true,
        sortValue: (user) => user.email,
        searchValue: (user) => user.email,
        render: (user) => (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={user.image || undefined}
              sx={(theme) => ({ width: theme.spacing(4), height: theme.spacing(4) })}
            >
              {user.email.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="subtitle2">{user.email}</Typography>
          </Stack>
        ),
      },
      {
        id: "role",
        label: "Role",
        width: "20%",
        sortable: true,
        sortValue: (user) => user.role,
        render: (user) => {
          const config = ROLE_CONFIG[user.role];

          return (
            <Chip
              label={config.label}
              color={config.color}
              size="small"
              variant="outlined"
              onClick={(e) => handleChipClick(e, user.id)}
              sx={{ cursor: "pointer" }}
            />
          );
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
              <IconButton component={Link} href={`/users/${user.id}`} color="primary">
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [handleChipClick],
  );

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search by email..."
        filters={filters}
        paginated
        defaultSort={{ columnId: "createdAt", direction: "desc" }}
        emptyMessage="No users found."
        state={state}
        onStateChange={onStateChange}
      />

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={handleMenuClose}>
        {Object.values(UserRole).map((role) => (
          <MenuItem
            key={role}
            onClick={() => handleRoleSelect(role)}
            selected={menuUser?.role === role}
          >
            {ROLE_CONFIG[role].label}
          </MenuItem>
        ))}
      </Menu>

      <ConfirmationModal
        open={!!pendingChange}
        title="Change User Role"
        message={
          pendingChange
            ? `Change role from "${ROLE_CONFIG[pendingChange.currentRole].label}" to "${ROLE_CONFIG[pendingChange.newRole].label}"?`
            : ""
        }
        details="This will immediately affect the user's permissions and access level."
        confirmText="Change Role"
        type="warning"
        isConfirming={isPending}
        onConfirm={handleConfirm}
        onClose={() => setPendingChange(null)}
      />
    </>
  );
};
