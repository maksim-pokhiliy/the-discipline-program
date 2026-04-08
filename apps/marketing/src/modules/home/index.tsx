"use client";

import { Stack } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/ui";

import { StructuredData } from "@app/lib/components/seo";
import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";
import { useHomePage } from "@app/lib/hooks";

import { HomeFeaturesSection, HomeStorefrontProgramsPreview, HomeReviewsSection } from "./sections";

type HomePageClientProps = {
  initialData: HomePageData;
};

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
            <FullscreenSection
              backgroundImage={data.hero.backgroundImage}
              title={data.hero.title}
              subtitle={data.hero.subtitle}
              buttonText={data.hero.buttonText}
              buttonHref={data.hero.buttonHref}
            />
            <HomeFeaturesSection whyChoose={data.whyChoose} />

            <HomeStorefrontProgramsPreview
              programs={data.storefront}
              productsList={data.productsList}
            />

            <HomeReviewsSection reviews={data.reviews} reviewsList={data.reviewsList} />
            <PageCTASection
              id="home-cta"
              title={data.contact.title}
              subtitle={data.contact.subtitle}
              buttonText={data.contact.buttonText}
              buttonHref={data.contact.buttonHref}
            />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
