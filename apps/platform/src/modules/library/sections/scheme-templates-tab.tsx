"use client";

import { useCallback, useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Alert, Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";
import { useDeleteConfirmation } from "@repo/query";
import { ConfirmationModal, DataTable, type Column, useDataTableUrlState } from "@repo/ui";

import { useDeleteSchemeTemplate, useSchemeTemplatesPageData } from "@app/lib/hooks";

import { LibrarySearch, SchemeTemplateFormModal } from "../components";
import { formatToken, SCOPE_CHIP_COLOR, type ScopeFilterValue } from "../constants";

type SchemeTemplatesTabProps = {
  currentUserId: string;
};

export const SchemeTemplatesTab = ({ currentUserId }: SchemeTemplatesTabProps) => {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<ScopeFilterValue>("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchemeTemplate | null>(null);

  const { data, isLoading, error } = useSchemeTemplatesPageData(
    { search: search.length > 0 ? search : undefined, scope },
    currentUserId,
  );

  const deleteMutation = useDeleteSchemeTemplate();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "name", direction: "asc" },
  });

  const isOwn = useCallback(
    (item: SchemeTemplate) => item.scope === "COACH" && item.ownerId === currentUserId,
    [currentUserId],
  );

  const columns: Column<SchemeTemplate>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "30%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        render: (item) => <Typography variant="subtitle2">{item.name}</Typography>,
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
        id: "archetypeKind",
        label: "Archetype",
        width: "22%",
        sortable: true,
        sortValue: (item) => item.archetypeKind,
        render: (item) => (
          <Typography variant="body2">{formatToken(item.archetypeKind)}</Typography>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "20%",
        render: (item) => {
          if (!isOwn(item)) {
            return (
              <Typography variant="caption" color="text.secondary">
                Read-only
              </Typography>
            );
          }

          return (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              <Tooltip title="Edit">
                <IconButton
                  onClick={() => setEditTarget(item)}
                  color="primary"
                  aria-label="Edit"
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton
                  onClick={() => requestDelete(item.id)}
                  color="error"
                  aria-label="Delete"
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [isOwn, requestDelete],
  );

  const items = data?.items ?? [];

  return (
    <Stack spacing={2}>
      <LibrarySearch
        searchValue={search}
        onSearchChange={setSearch}
        scope={scope}
        onScopeChange={setScope}
        placeholder="Search scheme templates..."
      />

      {error && <Alert severity="error">{error.message}</Alert>}

      <DataTable
        data={items}
        columns={columns}
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
        details="This will soft-delete the row. Plans referencing it keep their snapshot."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </Stack>
  );
};
