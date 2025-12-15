"use client";

import { Container, Grid } from "@mui/material";
import { Program, ProgramsPageData } from "@repo/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ContentSection } from "@app/shared/components/ui";

import { ProgramCard } from "../card";
import { ProgramModal } from "../modal";

interface ProgramsGridSectionProps {
  programsList: ProgramsPageData["programsList"];
}

export const ProgramsGridSection = ({ programsList }: ProgramsGridSectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  useEffect(() => {
    const programSlug = searchParams.get("program");

    if (programSlug) {
      const program = programsList.find((p) => p.slug === programSlug);

      if (program) {
        setSelectedProgram(program);
      }
    }
  }, [searchParams, programsList]);

  const handleOpenModal = (program: Program) => {
    setSelectedProgram(program);
    router.push(`/programs?program=${program.slug}`, { scroll: false });
  };

  const handleCloseModal = () => {
    setSelectedProgram(null);
    router.push("/programs", { scroll: false });
  };

  return (
    <ContentSection>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {programsList.map((program) => (
            <Grid key={program.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ProgramCard program={program} onLearnMore={() => handleOpenModal(program)} />
            </Grid>
          ))}
        </Grid>
      </Container>

      <ProgramModal
        program={selectedProgram}
        open={selectedProgram !== null}
        onClose={handleCloseModal}
      />
    </ContentSection>
  );
};
