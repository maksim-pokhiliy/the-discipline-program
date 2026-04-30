"use client";

import { useCallback, useMemo, useState } from "react";

import { Alert, Chip, Stack, Typography } from "@mui/material";

import { UserRole } from "@repo/contracts/iam/auth";
import { type SessionTemplate } from "@repo/contracts/lms/session-template";
import { useDeleteConfirmation } from "@repo/query";
import {
  type Column,
  ConfirmationModal,
  DataTable,
  type DataTableFilter,
  UserChip,
  useDataTableUrlState,
} from "@repo/ui";

import {
  useCurrentUserRole,
  useDeleteSessionTemplate,
  useDemoteSessionTemplate,
  usePlatformCoaches,
  usePromoteSessionTemplate,
  useSessionTemplatesPageData,
} from "@app/lib/hooks";

import { DemoteDialog, LibraryRowActions, TemplateEditDialog } from "../components";
import { SCOPE_CHIP_COLOR } from "../constants";

type SessionTemplatesTabProps = {
  currentUserId: string;
};

const SCOPE_FILTER_OPTIONS = [
  { value: "SYSTEM", label: "System" },
  { value: "COACH", label: "Coach (any)" },
  { value: "OWN", label: "Mine" },
];

export const SessionTemplatesTab = ({ currentUserId }: SessionTemplatesTabProps) => {
  const role = useCurrentUserRole();
  const isPrivileged = role === UserRole.HEAD_COACH || role === UserRole.ADMIN;

  const [demoteTarget, setDemoteTarget] = useState<SessionTemplate | null>(null);
  const [editTarget, setEditTarget] = useState<SessionTemplate | null>(null);

  const { data, isLoading, error } = useSessionTemplatesPageData({}, currentUserId);
  const { data: coaches } = usePlatformCoaches(isPrivileged);

  const deleteMutation = useDeleteSessionTemplate();
  const promoteMutation = usePromoteSessionTemplate();
  const demoteMutation = useDemoteSessionTemplate();

  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "name", direction: "asc" },
  });

  const ownerByUserId = useMemo(() => {
    const map = new Map<string, { id: string; name: string | null; email: string }>();

    coaches?.forEach((coach) => {
      map.set(coach.userId, { id: coach.userId, name: coach.name, email: coach.email });
    });

    return map;
  }, [coaches]);

  const isOwn = useCallback(
    (item: SessionTemplate) => item.scope === "COACH" && item.ownerId === currentUserId,
    [currentUserId],
  );

  const filters: DataTableFilter<SessionTemplate>[] = useMemo(
    () => [
      {
        id: "scope",
        label: "Scope",
        options: SCOPE_FILTER_OPTIONS,
        match: (item, value) => {
          if (value === "OWN") {
            return isOwn(item);
          }

          return item.scope === value;
        },
      },
    ],
    [isOwn],
  );

  const handleDemoteConfirm = useCallback(
    (newOwnerId: string) => {
      if (!demoteTarget) {
        return;
      }

      demoteMutation.mutate(
        { id: demoteTarget.id, newOwnerId },
        { onSettled: () => setDemoteTarget(null) },
      );
    },
    [demoteMutation, demoteTarget],
  );

  const columns: Column<SessionTemplate>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "32%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => item.name,
        render: (item) => <Typography variant="subtitle2">{item.name}</Typography>,
      },
      {
        id: "scope",
        label: "Scope",
        width: "14%",
        sortable: true,
        sortValue: (item) => item.scope,
        render: (item) => (
          <Chip
            label={item.scope === "SYSTEM" ? "System" : isOwn(item) ? "Mine" : "Coach"}
            color={SCOPE_CHIP_COLOR[item.scope]}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "owner",
        label: "Owner",
        width: "24%",
        render: (item) => <UserChip user={item.ownerId ? ownerByUserId.get(item.ownerId) : null} />,
      },
      {
        id: "description",
        label: "Description",
        width: "22%",
        render: (item) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {item.description ?? "—"}
          </Typography>
        ),
      },
      {
        id: "actions",
        label: "",
        align: "right",
        width: "8%",
        render: (item) => (
          <LibraryRowActions
            role={role}
            isOwn={isOwn(item)}
            scope={item.scope}
            onEdit={() => setEditTarget(item)}
            onDelete={() => requestDelete(item.id)}
            onPromote={() => promoteMutation.mutate(item.id)}
            onDemote={() => setDemoteTarget(item)}
          />
        ),
      },
    ],
    [isOwn, ownerByUserId, promoteMutation, requestDelete, role],
  );

  const items = data?.items ?? [];

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error.message}</Alert>}

      <DataTable
        data={items}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search session templates..."
        paginated
        emptyMessage={
          isLoading ? "Loading session templates..." : "No session templates match your filters."
        }
        state={state}
        onStateChange={onStateChange}
      />

      <TemplateEditDialog
        open={!!editTarget}
        kind="session"
        template={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete session template"
        message="Are you sure you want to delete this session template?"
        details="This will soft-delete the row. Plans referencing it keep their snapshot."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />

      <DemoteDialog
        open={!!demoteTarget}
        itemName={demoteTarget?.name ?? ""}
        coaches={coaches ?? []}
        isPending={demoteMutation.isPending}
        onClose={() => setDemoteTarget(null)}
        onConfirm={handleDemoteConfirm}
      />
    </Stack>
  );
};
