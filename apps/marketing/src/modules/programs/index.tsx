"use client";

import { Stack } from "@mui/material";
import { ProgramsPageData } from "@repo/api";
import { QueryWrapper } from "@repo/query";
import Head from "next/head";

import { useProgramsPage } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

import { ProgramsCTA, ProgramsGridSection, ProgramsHeroSection } from "./sections";

interface ProgramsPageClientProps {
  initialData: ProgramsPageData;
}

export const ProgramsPageClient = ({ initialData }: ProgramsPageClientProps) => {
  const { data, isLoading, error } = useProgramsPage({ initialData });

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading programs..."
    >
      {(data) => (
        <>
          <Head>
            <StructuredData type="programs" data={{ programs: data.programsList }} />
          </Head>

          <Stack spacing={0}>
            <ProgramsHeroSection hero={data.hero} />
            <ProgramsGridSection programsList={data.programsList} />
            <ProgramsCTA />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
