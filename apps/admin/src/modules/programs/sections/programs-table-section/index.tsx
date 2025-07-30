import AddIcon from "@mui/icons-material/Add";
import { Button, Stack } from "@mui/material";
import { Program } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { ContentSection } from "@app/shared/components/ui/content-section";

import { ProgramModal } from "../../components";
import { ProgramsTable } from "../../components/programs-table";

interface ProgramsTableSectionProps {
  programs: Program[];
}

export const ProgramsTableSection = ({ programs }: ProgramsTableSectionProps) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const modal = useModal();

  const handleCreateProgram = () => {
    setSelectedProgram(null);
    modal.open();
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    modal.open();
  };

  const handleCloseModal = () => {
    modal.close();
    setSelectedProgram(null);
  };

  return (
    <ContentSection
      title="Training Programs"
      subtitle="Manage your fitness programs and their availability"
    >
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProgram}
            size="medium"
          >
            Add New Program
          </Button>
        </Stack>

        <ProgramsTable programs={programs} onEditProgram={handleEditProgram} />
        <ProgramModal open={modal.isOpen} onClose={handleCloseModal} program={selectedProgram} />
      </Stack>
    </ContentSection>
  );
};
