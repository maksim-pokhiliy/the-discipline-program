"use client";

import { type FaqPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";

import { useFaqPage } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

import { FaqSection } from "./sections";

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
          <FaqSection content={data.content} />
        </>
      )}
    </QueryWrapper>
  );
};
