"use client";

import { Stack } from "@mui/material";

import { type StorefrontProgramsPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";
import { SuspenseWrapper } from "@repo/ui";

import { useStorefrontProgramsPage } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

import { StorefrontProgramsCTA, StorefrontProgramsGridSection } from "./sections";

interface StorefrontProgramsPageClientProps {
  initialData: StorefrontProgramsPageData;
}

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

            <Stack spacing={0}>
              <StorefrontProgramsGridSection hero={data.hero} productsList={data.productsList} />
              <StorefrontProgramsCTA cta={data.cta} />
            </Stack>
          </>
        )}
      </QueryWrapper>
    </SuspenseWrapper>
  );
};
