"use client";

import { type FaqPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";

import { StructuredData } from "@app/lib/components/seo";
import { useFaqPage } from "@app/lib/hooks";

import { FaqCtaSection, FaqHeroSection, FaqSection } from "./sections";

interface FaqPageClientProps {
  initialData: FaqPageData;
}

export const FaqPageClient = ({ initialData }: FaqPageClientProps) => {
  const { data, isLoading, error } = useFaqPage({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading FAQ...">
      {(data) => (
        <>
          <StructuredData type="faq" data={{ faqItems: data.content.items }} />
          <FaqHeroSection hero={data.hero} />
          <FaqSection content={data.content} />
          <FaqCtaSection cta={data.cta} />
        </>
      )}
    </QueryWrapper>
  );
};
