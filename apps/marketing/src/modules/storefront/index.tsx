"use client";

import { type StorefrontProgramsPageData } from "@repo/contracts/pages";
import { QueryWrapper, SuspenseWrapper } from "@repo/ui";

import { StructuredData } from "@app/lib/components/seo";
import { useStorefrontProgramsPage } from "@app/lib/hooks";

import {
  StorefrontHeroSection,
  StorefrontProgramsCTA,
  StorefrontProgramsGridSection,
} from "./sections";

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
            <StorefrontHeroSection hero={data.hero} />
            <StorefrontProgramsGridSection grid={data.grid} productsList={data.productsList} />
            <StorefrontProgramsCTA cta={data.cta} />
          </>
        )}
      </QueryWrapper>
    </SuspenseWrapper>
  );
};
