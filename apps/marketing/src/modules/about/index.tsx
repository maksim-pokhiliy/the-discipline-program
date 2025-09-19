"use client";

import { Stack } from "@mui/material";

import { useAboutPage } from "@app/lib/hooks";
import { QueryWrapper } from "@app/shared/components/ui";

import {
  AboutCredentialsSection,
  AboutCTASection,
  AboutHeroSection,
  AboutJourneySection,
  AboutPersonalSection,
} from "./sections";

export const AboutPage = () => {
  const { data, isLoading, error } = useAboutPage();

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
