"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Button, Chip, IconButton, Stack, Switch, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type Program } from "@repo/contracts/program";
import { ConfirmationModal, DataTable, type Column, PanelSection } from "@repo/ui";

import { useDeleteProgram, useToggleProgramStatus } from "@app/lib/hooks/use-programs";

interface ProgramsListSectionProps {
  programs: Program[];
}

export const ProgramsListSection = ({ programs }: ProgramsListSectionProps) => {
  const { mutateAsync: toggleStatus } = useToggleProgramStatus();
  const { mutate: deleteProgram, isPending: isDeleting } = useDeleteProgram();

  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string) => {
    setLoadingId(id);
    try {
      await toggleStatus(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (programToDelete) {
      await deleteProgram(programToDelete, {
        onSuccess: () => setProgramToDelete(null),
      });
    }
  };

  const columns: Column<Program>[] = [
    {
      id: "title",
      label: "Program Name",
      width: "35%",
      render: (program) => (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" component="span" fontWeight={600}>
            {program.title}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            /{program.slug}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "isActive",
      label: "Status",
      width: "20%",
      render: (program) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            size="small"
            checked={program.isActive}
            disabled={loadingId === program.id}
            onChange={() => handleToggleStatus(program.id)}
            color="success"
          />

          <Chip
            label={program.isActive ? "Active" : "Inactive"}
            color={program.isActive ? "success" : "default"}
            size="small"
            variant="outlined"
            sx={{ minWidth: 80, justifyContent: "center" }}
          />
        </Stack>
      ),
    },
    {
      id: "priceLabel",
      label: "Price",
      width: "15%",
      render: (program) => <Typography variant="body2">{program.priceLabel || "Free"}</Typography>,
    },
    {
      id: "features",
      label: "Features",
      width: "15%",
      render: (program) => (
        <Chip label={`${program.features.length} items`} size="small" variant="outlined" />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      width: "15%",
      render: (program) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton
              component={Link}
              href={`/programs/${program.id}`}
              size="small"
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setProgramToDelete(program.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PanelSection
        title="Training Programs"
        action={
          <Button
            component={Link}
            href="/programs/create"
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
          >
            Create Program
          </Button>
        }
      >
        <DataTable
          data={programs}
          columns={columns}
          emptyMessage="No programs found. Start by creating one!"
        />
      </PanelSection>

      <ConfirmationModal
        open={!!programToDelete}
        title="Delete Program"
        onClose={() => setProgramToDelete(null)}
        type="danger"
        message="Are you sure you want to delete this program?"
        details="This will remove the program from the marketing site immediately. This action cannot be undone."
        confirmText="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
