"use client";

import { type StorefrontProgramsPageData } from "@repo/contracts/pages";
import { QueryWrapper, SuspenseWrapper } from "@repo/ui";

import { StructuredData } from "@app/lib/components/seo";
import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";
import { useStorefrontProgramsPage } from "@app/lib/hooks";

import { StorefrontProgramsGridSection } from "./sections";

type StorefrontProgramsPageClientProps = {
  initialData: StorefrontProgramsPageData;
};

export const StorefrontProgramsPageClient = ({
  initialData,
}: StorefrontProgramsPageClientProps) => {
  const { data, isLoading, error } = useStorefrontProgramsPage({ initialData });

  return (
    <SuspenseWrapper>
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={data}
        loadingMessage="Loading storefront..."
      >
        {(data) => (
          <>
            <StructuredData type="storefront" data={{ products: data.productsList }} />
            <FullscreenSection
              backgroundImage={data.hero.backgroundImage}
              title={data.hero.title}
              subtitle={data.hero.subtitle}
              buttonText={data.hero.buttonText}
              buttonHref={data.hero.buttonHref}
            />
            <StorefrontProgramsGridSection grid={data.grid} productsList={data.productsList} />
            <PageCTASection
              id="storefront-cta"
              title={data.cta.title}
              subtitle={data.cta.subtitle}
              buttonText={data.cta.buttonText}
              buttonHref={data.cta.buttonHref}
            />
          </>
        )}
      </QueryWrapper>
    </SuspenseWrapper>
  );
};
