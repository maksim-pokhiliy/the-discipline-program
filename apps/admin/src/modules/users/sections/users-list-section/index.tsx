"use client";

import { useCallback, useMemo, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { UserRole } from "@repo/contracts/iam/auth";
import { type AdminUserListItem } from "@repo/contracts/iam/user";
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import {
  ConfirmationModal,
  DataTable,
  UserChip,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useChipMenu, useDeleteUser, useUpdateUserRole } from "@app/lib/hooks";

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

type UsersListSectionProps = {
  users: AdminUserListItem[];
};

export const UsersListSection = ({ users }: UsersListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "createdAt", direction: "desc" },
  });
  const { mutate: updateRole, isPending } = useUpdateUserRole();
  const deleteMutation = useDeleteUser();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });
  const { anchorEl, menuItemId, openMenu, closeMenu } = useChipMenu();
  const [pendingChange, setPendingChange] = useState<{
    userId: string;
    currentRole: UserRole;
    newRole: UserRole;
  } | null>(null);

  const handleRoleSelect = useCallback(
    (newRole: UserRole) => {
      const currentUser = users.find((u) => u.id === menuItemId);

      closeMenu();

      if (!currentUser || currentUser.role === newRole) {
        return;
      }

      setPendingChange({
        userId: currentUser.id,
        currentRole: currentUser.role,
        newRole,
      });
    },
    [users, menuItemId, closeMenu],
  );

  const menuUser = useMemo(() => users.find((u) => u.id === menuItemId), [users, menuItemId]);

  const handleConfirm = useCallback(() => {
    if (pendingChange) {
      updateRole(
        { id: pendingChange.userId, data: { role: pendingChange.newRole } },
        { onSettled: () => setPendingChange(null) },
      );
    }
  }, [pendingChange, updateRole]);

  const columns: Column<AdminUserListItem>[] = useMemo(
    () => [
      {
        id: "email",
        label: "Email",
        width: "45%",
        sortable: true,
        sortValue: (user) => user.email,
        searchValue: (user) => user.email,
        render: (user) => <UserChip user={user} size="medium" />,
      },
      {
        id: "role",
        label: "Role",
        width: "20%",
        sortable: true,
        sortValue: (user) => user.role,
        render: (user) => {
          if (!user.hasPassword) {
            return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
          }

          const config = ROLE_CONFIG[user.role];

          return (
            <Chip
              label={config.label}
              {...(config.color !== undefined && { color: config.color })}
              size="small"
              variant="outlined"
              onClick={(e) => openMenu(e, user.id)}
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
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/users/${user.id}`}
                color="primary"
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => requestDelete(user.id)} color="error" aria-label="Delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [openMenu, requestDelete],
  );

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search by email..."
        filters={filters}
        action={<CreateButton href="/users/create">Create User</CreateButton>}
        paginated
        emptyMessage="No users found."
        state={state}
        onStateChange={onStateChange}
      />

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={closeMenu}>
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

      <ConfirmationModal
        open={!!deleteId}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        details="This will soft-delete the user; their email will be suffixed and the user is logged out on next session refresh."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </>
  );
};
