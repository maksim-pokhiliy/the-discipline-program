"use client";

import { Stack } from "@mui/material";

import { type AboutPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/ui";

import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";
import { useAboutPage } from "@app/lib/hooks";

import { AboutCredentialsSection, AboutJourneySection, AboutPersonalSection } from "./sections";

type AboutPageClientProps = {
  initialData: AboutPageData;
};

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
          <FullscreenSection
            backgroundImage={data.hero.backgroundImage}
            title={data.hero.title}
            subtitle={data.hero.subtitle}
            buttonText={data.hero.buttonText}
            buttonHref={data.hero.buttonHref}
          />
          <AboutJourneySection journey={data.journey} />
          <AboutCredentialsSection credentials={data.credentials} />
          <AboutPersonalSection personal={data.personal} />
          <PageCTASection
            id="about-cta"
            title={data.cta.title}
            subtitle={data.cta.subtitle}
            buttonText={data.cta.buttonText}
            buttonHref={data.cta.buttonHref}
          />
        </Stack>
      )}
    </QueryWrapper>
  );
};
