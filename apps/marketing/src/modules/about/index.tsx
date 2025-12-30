"use client";

import { Stack } from "@mui/material";
import { AboutPageData } from "@repo/api";
import { QueryWrapper } from "@repo/query";

import { useAboutPage } from "@app/lib/hooks";

import {
  AboutCredentialsSection,
  AboutCTASection,
  AboutHeroSection,
  AboutJourneySection,
  AboutPersonalSection,
} from "./sections";

interface AboutPageClientProps {
  initialData: AboutPageData;
}

export const AboutPageClient = ({ initialData }: AboutPageClientProps) => {
  const { data, isLoading, error } = useAboutPage({ initialData });

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading about page..."
    >
      {(data) => (
        <Stack spacing={0}>
          <AboutHeroSection hero={data.hero} />
          <AboutJourneySection journey={data.journey} />
          <AboutCredentialsSection credentials={data.credentials} />
          <AboutPersonalSection personal={data.personal} />
          <AboutCTASection cta={data.cta} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
