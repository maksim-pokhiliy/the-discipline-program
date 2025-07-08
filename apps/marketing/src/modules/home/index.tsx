"use client";

import { Stack } from "@mui/material";
import Head from "next/head";

import { useHomePage } from "@app/lib/hooks/use-marketing-api";
import { StructuredData } from "@app/shared/components/seo";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { HomeFeaturesSection } from "./components/home-features";
import { HomeFinalCTASection } from "./components/home-final-cta-section";
import { HomeHeroSection } from "./components/home-hero";
import { HomeProgramsPreview } from "./components/home-programs-preview";
import { HomeReviewsSection } from "./components/home-reviews";

export const HomePage = () => {
  const { data, isLoading, error } = useHomePage();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading home page..."
    >
      {(data) => (
        <>
          <Head>
            <StructuredData type="website" />
            <StructuredData type="organization" />
            <StructuredData type="person" />

            <StructuredData type="programs" data={{ programs: data.programsList }} />

            <StructuredData type="reviews" data={{ reviews: data.reviewsList }} />
          </Head>

          <Stack spacing={0}>
            <HomeHeroSection hero={data.hero} />
            <HomeFeaturesSection whyChoose={data.whyChoose} features={data.features} />
            <HomeProgramsPreview programs={data.programs} programsList={data.programsList} />
            <HomeReviewsSection reviews={data.reviews} reviewsList={data.reviewsList} />
            <HomeFinalCTASection />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
