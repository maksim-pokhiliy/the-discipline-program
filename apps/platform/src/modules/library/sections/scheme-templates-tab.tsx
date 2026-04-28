"use client";

import { useCallback, useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, ButtonBase, Chip, Stack, Typography } from "@mui/material";

import { UserRole } from "@repo/contracts/iam/auth";
import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";
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
  useDeleteSchemeTemplate,
  useDemoteSchemeTemplate,
  usePlatformCoaches,
  usePromoteSchemeTemplate,
  useSchemeTemplatesPageData,
} from "@app/lib/hooks";

import { DemoteDialog, LibraryRowActions, SchemeTemplateFormModal } from "../components";
import { formatToken, SCOPE_CHIP_COLOR } from "../constants";

type SchemeTemplatesTabProps = {
  currentUserId: string;
};

const SCOPE_FILTER_OPTIONS = [
  { value: "SYSTEM", label: "System" },
  { value: "COACH", label: "Coach (any)" },
  { value: "OWN", label: "Mine" },
];

export const SchemeTemplatesTab = ({ currentUserId }: SchemeTemplatesTabProps) => {
  const role = useCurrentUserRole();
  const isPrivileged = role === UserRole.HEAD_COACH || role === UserRole.ADMIN;

  const [editTarget, setEditTarget] = useState<SchemeTemplate | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState<SchemeTemplate | null>(null);

  const { data, isLoading, error } = useSchemeTemplatesPageData({}, currentUserId);
  const { data: coaches } = usePlatformCoaches(isPrivileged);

  const deleteMutation = useDeleteSchemeTemplate();
  const promoteMutation = usePromoteSchemeTemplate();
  const demoteMutation = useDemoteSchemeTemplate();

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
    (item: SchemeTemplate) => item.scope === "COACH" && item.ownerId === currentUserId,
    [currentUserId],
  );

  const filters: DataTableFilter<SchemeTemplate>[] = useMemo(
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

  const columns: Column<SchemeTemplate>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "26%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => item.name,
        render: (item) => {
          const canEdit = isPrivileged || isOwn(item);

          if (!canEdit) {
            return <Typography variant="subtitle2">{item.name}</Typography>;
          }

          return (
            <ButtonBase
              onClick={() => setEditTarget(item)}
              sx={{ textAlign: "left", justifyContent: "flex-start", width: "100%" }}
            >
              <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
                {item.name}
              </Typography>
            </ButtonBase>
          );
        },
      },
      {
        id: "scope",
        label: "Scope",
        width: "12%",
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
        width: "20%",
        render: (item) => <UserChip user={item.ownerId ? ownerByUserId.get(item.ownerId) : null} />,
      },
      {
        id: "archetypeKind",
        label: "Archetype",
        width: "26%",
        sortable: true,
        sortValue: (item) => item.archetypeKind,
        render: (item) => (
          <Typography variant="body2">{formatToken(item.archetypeKind)}</Typography>
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
    [isOwn, isPrivileged, ownerByUserId, promoteMutation, requestDelete, role],
  );

  const items = data?.items ?? [];

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error.message}</Alert>}

      <DataTable
        data={items}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search scheme templates..."
        paginated
        emptyMessage={
          isLoading ? "Loading scheme templates..." : "No scheme templates match your filters."
        }
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create scheme template
          </Button>
        }
        state={state}
        onStateChange={onStateChange}
      />

      <SchemeTemplateFormModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <SchemeTemplateFormModal
        open={!!editTarget}
        initial={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete scheme template"
        message="Are you sure you want to delete this scheme template?"
        details="This will soft-delete the row. Plans referencing it keep their snapshot. This may affect existing plans."
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
