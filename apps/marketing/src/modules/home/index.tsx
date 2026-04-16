import { type HomePageData } from "@repo/contracts/cms/pages";
import { SuspenseWrapper } from "@repo/ui";

import { StructuredData } from "@app/lib/components/seo";
import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";

import { HomeFeaturesSection, HomeStorefrontProgramsPreview, HomeReviewsSection } from "./sections";

type HomePageContentProps = {
  data: HomePageData;
};

export const HomePageContent = ({ data }: HomePageContentProps) => (
  <>
    <StructuredData type="person" />
    <StructuredData type="storefront" data={{ products: data.productsList }} />
    <StructuredData type="reviews" data={{ reviews: data.reviewsList }} />

    {data.hero && (
      <FullscreenSection
        backgroundImage={data.hero.backgroundImage}
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        buttonText={data.hero.buttonText}
        buttonHref={data.hero.buttonHref}
        priority
      />
    )}

    {data.whyChoose && <HomeFeaturesSection whyChoose={data.whyChoose} />}

    {data.storefront && (
      <SuspenseWrapper>
        <HomeStorefrontProgramsPreview
          programs={data.storefront}
          productsList={data.productsList}
        />
      </SuspenseWrapper>
    )}

    {data.reviews && <HomeReviewsSection reviews={data.reviews} reviewsList={data.reviewsList} />}

    {data.contact && (
      <PageCTASection
        id="home-cta"
        title={data.contact.title}
        subtitle={data.contact.subtitle}
        buttonText={data.contact.buttonText}
        buttonHref={data.contact.buttonHref}
      />
    )}
  </>
);
