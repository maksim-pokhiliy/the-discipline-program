"use client";

import { useCallback, useMemo, useState } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type CoachListItem } from "@repo/contracts/iam/user";
import { type SessionTemplate } from "@repo/contracts/lms/session-template";
import { useDeleteConfirmation } from "@repo/query";
import {
  ConfirmationModal,
  DataTable,
  UserChip,
  useDataTableUrlState,
  type Column,
  type DataTableFilter,
} from "@repo/ui";

import { useCoachesList, useDeleteSessionTemplate } from "@app/lib/hooks";

import { LIBRARY_SCOPE_OPTIONS, SCOPE_CHIP_COLOR } from "../../constants";
import { PromoteDemoteSection } from "../promote-demote-section";

const filters: DataTableFilter<SessionTemplate>[] = [
  {
    id: "scope",
    label: "Scope",
    options: LIBRARY_SCOPE_OPTIONS,
    match: (item, value) => item.scope === value,
  },
];

type PromoteState = { sessionTemplate: SessionTemplate } | null;
type DemoteState = { sessionTemplate: SessionTemplate } | null;

type SessionTemplateLibraryListSectionProps = {
  items: SessionTemplate[];
};

export const SessionTemplateLibraryListSection = ({
  items,
}: SessionTemplateLibraryListSectionProps) => {
  const { state, onStateChange } = useDataTableUrlState({
    defaultSort: { columnId: "name", direction: "asc" },
  });
  const deleteMutation = useDeleteSessionTemplate();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });
  const [promoteTarget, setPromoteTarget] = useState<PromoteState>(null);
  const [demoteTarget, setDemoteTarget] = useState<DemoteState>(null);
  const { data: coaches } = useCoachesList();

  const coachById = useMemo(() => {
    const map = new Map<string, CoachListItem>();

    for (const coach of coaches ?? []) {
      map.set(coach.userId, coach);
    }

    return map;
  }, [coaches]);

  const handlePromoteRequest = useCallback((sessionTemplate: SessionTemplate) => {
    setPromoteTarget({ sessionTemplate });
  }, []);

  const handleDemoteRequest = useCallback((sessionTemplate: SessionTemplate) => {
    setDemoteTarget({ sessionTemplate });
  }, []);

  const closePromoteDemote = useCallback(() => {
    setPromoteTarget(null);
    setDemoteTarget(null);
  }, []);

  const columns: Column<SessionTemplate>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        width: "35%",
        sortable: true,
        sortValue: (item) => item.name.toLowerCase(),
        searchValue: (item) => item.name,
        render: (item) => <Typography variant="subtitle2">{item.name}</Typography>,
      },
      {
        id: "scope",
        label: "Scope",
        width: "15%",
        sortable: true,
        sortValue: (item) => item.scope,
        render: (item) => (
          <Chip
            label={item.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[item.scope]}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "owner",
        label: "Owner",
        width: "25%",
        render: (item) => {
          if (!item.ownerId) {
            return (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            );
          }

          const coach = coachById.get(item.ownerId);

          return (
            <UserChip
              user={
                coach
                  ? { id: coach.userId, name: coach.name, email: coach.email }
                  : { id: item.ownerId }
              }
            />
          );
        },
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        width: "25%",
        render: (item) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {item.scope === "COACH" ? (
              <Tooltip title="Promote to SYSTEM">
                <IconButton
                  onClick={() => handlePromoteRequest(item)}
                  color="primary"
                  aria-label="Promote"
                  size="small"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Demote to COACH">
                <IconButton
                  onClick={() => handleDemoteRequest(item)}
                  color="warning"
                  aria-label="Demote"
                  size="small"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Edit">
              <IconButton
                component={Link}
                href={`/library/session-templates/${item.id}`}
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
        ),
      },
    ],
    [coachById, handleDemoteRequest, handlePromoteRequest, requestDelete],
  );

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search by name..."
        filters={filters}
        paginated
        emptyMessage="No session templates yet."
        state={state}
        onStateChange={onStateChange}
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

      <PromoteDemoteSection
        promoteTarget={promoteTarget}
        demoteTarget={demoteTarget}
        onClose={closePromoteDemote}
      />
    </>
  );
};
