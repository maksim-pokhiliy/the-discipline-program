"use client";

import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

import { type StorefrontProgram, type StorefrontProgramsPageData } from "@repo/contracts";
import { ContentSection } from "@repo/ui";

import { StorefrontProgramCard } from "../card";
import { StorefrontProgramModal } from "../modal";

interface ProgramsGridSectionProps {
  programsList: StorefrontProgramsPageData["programsList"];
}

export const StorefrontProgramsGridSection = ({ programsList }: ProgramsGridSectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedProgram, setSelectedProgram] = useState<StorefrontProgram | null>(null);

  useEffect(() => {
    const programSlug = searchParams.get("program");

    if (programSlug) {
      const program = programsList.find((p) => p.slug === programSlug);

      if (program) {
        setSelectedProgram(program);
      }
    }
  }, [searchParams, programsList]);

  const handleOpenModal = (program: StorefrontProgram) => {
    setSelectedProgram(program);
    router.push(`/storefront?program=${program.slug}`, { scroll: false });
  };

  const handleCloseModal = () => {
    setSelectedProgram(null);
    router.push("/storefront", { scroll: false });
  };

  return (
    <ContentSection>
      <Grid container spacing={4}>
        {programsList.map((program) => (
          <Grid key={program.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <StorefrontProgramCard program={program} onLearnMore={() => handleOpenModal(program)} />
          </Grid>
        ))}
      </Grid>

      <StorefrontProgramModal
        program={selectedProgram}
        open={selectedProgram !== null}
        onClose={handleCloseModal}
      />
    </ContentSection>
  );
};
