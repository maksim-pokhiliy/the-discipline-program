"use client";

import { Stack } from "@mui/material";
import Head from "next/head";

import { type HomePageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";

import { useHomePage } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

import {
  HomeFeaturesSection,
  HomeFinalCTASection,
  HomeHeroSection,
  HomeStorefrontProgramsPreview,
  HomeReviewsSection,
} from "./sections";

interface HomePageClientProps {
  initialData: HomePageData;
}

export const HomePageClient = ({ initialData }: HomePageClientProps) => {
  const { data, isLoading, error } = useHomePage({ initialData });

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

            <StructuredData
              type="storefront"
              data={{ storefrontPrograms: data.storefrontProgramsList }}
            />

            <StructuredData type="reviews" data={{ reviews: data.reviewsList }} />
          </Head>

          <Stack spacing={0}>
            <HomeHeroSection hero={data.hero} />
            <HomeFeaturesSection whyChoose={data.whyChoose} features={data.features} />

            <HomeStorefrontProgramsPreview
              programs={data.storefront}
              programsList={data.storefrontProgramsList}
            />

            <HomeReviewsSection reviews={data.reviews} reviewsList={data.reviewsList} />
            <HomeFinalCTASection />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
