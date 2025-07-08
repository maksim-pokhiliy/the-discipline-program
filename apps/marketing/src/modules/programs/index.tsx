"use client";

import { Stack } from "@mui/material";
import Head from "next/head";

import { useProgramsPage } from "@app/lib/hooks/use-marketing-api";
import { StructuredData } from "@app/shared/components/seo";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { ProgramsCTA } from "./components/programs-cta";
import { ProgramsGridSection } from "./components/programs-grid";
import { ProgramsHeroSection } from "./components/programs-hero";

export const ProgramsPage = () => {
  const { data, isLoading, error } = useProgramsPage();

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
