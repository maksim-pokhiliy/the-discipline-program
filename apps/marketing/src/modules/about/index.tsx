"use client";

import { Stack } from "@mui/material";

import { useAboutPage } from "@app/lib/hooks/use-marketing-api";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { AboutCredentialsSection } from "./sections/about-credentials";
import { AboutCTASection } from "./sections/about-cta";
import { AboutHeroSection } from "./sections/about-hero";
import { AboutJourneySection } from "./sections/about-journey";
import { AboutPersonalSection } from "./sections/about-personal";

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
