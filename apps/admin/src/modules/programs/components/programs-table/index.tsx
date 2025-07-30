import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Box,
} from "@mui/material";
import { Program } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { useProgramMutations } from "@app/lib/hooks/use-admin-api";

import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ProgramRow } from "./program-row";

interface ProgramsTableProps {
  programs: Program[];
  onEditProgram: (program: Program) => void;
}

type SortField = keyof Pick<Program, "name" | "price" | "sortOrder" | "createdAt">;
type SortDirection = "asc" | "desc";

export const ProgramsTable = ({ programs, onEditProgram }: ProgramsTableProps) => {
  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const deleteModal = useModal();
  const { deleteProgram, toggleStatus } = useProgramMutations();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedPrograms = [...programs].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "price":
        aValue = a.price;
        bValue = b.price;
        break;
      case "sortOrder":
        aValue = a.sortOrder;
        bValue = b.sortOrder;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleDeleteClick = (program: Program) => {
    setProgramToDelete(program);
    deleteModal.open();
  };

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;

    try {
      await deleteProgram.mutateAsync(programToDelete.id);
      deleteModal.close();
      setProgramToDelete(null);
    } catch (error) {
      // Error handling is done in the modal
      console.error("Delete failed:", error);
    }
  };

  const handleToggleStatus = async (programId: string) => {
    try {
      await toggleStatus.mutateAsync(programId);
    } catch (error) {
      console.error("Toggle status failed:", error);
    }
  };

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === "name"}
                  direction={sortField === "name" ? sortDirection : "asc"}
                  onClick={() => handleSort("name")}
                >
                  Program
                </TableSortLabel>
              </TableCell>

              <TableCell>Description</TableCell>

              <TableCell>
                <TableSortLabel
                  active={sortField === "price"}
                  direction={sortField === "price" ? sortDirection : "asc"}
                  onClick={() => handleSort("price")}
                >
                  Price
                </TableSortLabel>
              </TableCell>

              <TableCell>Status</TableCell>

              <TableCell>Features</TableCell>

              <TableCell>
                <TableSortLabel
                  active={sortField === "sortOrder"}
                  direction={sortField === "sortOrder" ? sortDirection : "asc"}
                  onClick={() => handleSort("sortOrder")}
                >
                  Sort Order
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedPrograms.map((program) => (
              <ProgramRow
                key={program.id}
                program={program}
                onEdit={() => onEditProgram(program)}
                onDelete={() => handleDeleteClick(program)}
                onToggleStatus={() => handleToggleStatus(program.id)}
                isToggling={toggleStatus.isPending}
              />
            ))}
          </TableBody>
        </Table>

        {programs.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            No programs found. Create your first program to get started.
          </Box>
        )}
      </TableContainer>

      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        program={programToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteProgram.isPending}
        error={deleteProgram.error?.message || null}
      />
    </>
  );
};
