"use client";

import { Stack } from "@mui/material";
import Head from "next/head";

import { useProgramsPage } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";
import { QueryWrapper } from "@app/shared/components/ui";

import { ProgramsCTA, ProgramsGridSection, ProgramsHeroSection } from "./sections";

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
