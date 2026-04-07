"use client";

import { Stack } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/ui";

import { StructuredData } from "@app/lib/components/seo";
import { useHomePage } from "@app/lib/hooks";

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
          <StructuredData type="person" />
          <StructuredData type="storefront" data={{ products: data.productsList }} />
          <StructuredData type="reviews" data={{ reviews: data.reviewsList }} />

          <Stack spacing={0}>
            <HomeHeroSection hero={data.hero} />
            <HomeFeaturesSection whyChoose={data.whyChoose} />

            <HomeStorefrontProgramsPreview
              programs={data.storefront}
              productsList={data.productsList}
            />

            <HomeReviewsSection reviews={data.reviews} reviewsList={data.reviewsList} />
            <HomeFinalCTASection contact={data.contact} />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
