"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { Program } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { useProgramMutations } from "@app/lib/hooks";

import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ProgramRow } from "./program-row";

interface ProgramsTableProps {
  programs: Program[];
  onEditProgram: (program: Program) => void;
  onDuplicateProgram: (program: Program) => void;
}

type SortField = keyof Pick<Program, "name" | "price" | "sortOrder" | "createdAt">;
type SortDirection = "asc" | "desc";

export const ProgramsTable = ({
  programs,
  onEditProgram,
  onDuplicateProgram,
}: ProgramsTableProps) => {
  const deleteModal = useModal();
  const { deleteProgram, toggleStatus, updateProgramsOrder } = useProgramMutations();

  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [togglingProgramId, setTogglingProgramId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      console.error("Delete failed:", error);
    }
  };

  const handleToggleStatus = async (programId: string) => {
    setTogglingProgramId(programId);

    try {
      await toggleStatus.mutateAsync(programId);
    } catch (error) {
      console.error("Toggle status failed:", error);
    } finally {
      setTogglingProgramId(null);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedPrograms.findIndex((program) => program.id === active.id);
    const newIndex = sortedPrograms.findIndex((program) => program.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedPrograms = arrayMove(sortedPrograms, oldIndex, newIndex);

    try {
      await updateProgramsOrder.mutateAsync(reorderedPrograms);
    } catch (error) {
      console.error("Failed to update sort order:", error);
    }
  };

  const isDragEnabled = sortField === "sortOrder" && sortDirection === "asc";

  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          overflow: isDragging ? "hidden" : "auto",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
              <SortableContext
                items={sortedPrograms.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
                disabled={!isDragEnabled}
              >
                {sortedPrograms.map((program) => (
                  <ProgramRow
                    key={program.id}
                    program={program}
                    onEdit={() => onEditProgram(program)}
                    onDelete={() => handleDeleteClick(program)}
                    onDuplicate={() => onDuplicateProgram(program)}
                    onToggleStatus={() => handleToggleStatus(program.id)}
                    isToggling={togglingProgramId === program.id}
                    isDragDisabled={!isDragEnabled}
                    isDragging={isDragging}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>

          {programs.length === 0 && (
            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              No programs found. Create your first program to get started.
            </Box>
          )}
        </DndContext>
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
