"use client";

import { type FaqPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/ui";

import { StructuredData } from "@app/lib/components/seo";
import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";
import { useFaqPage } from "@app/lib/hooks";

import { FaqSection } from "./sections";

type FaqPageClientProps = {
  initialData: FaqPageData;
};

export const FaqPageClient = ({ initialData }: FaqPageClientProps) => {
  const { data, isLoading, error } = useFaqPage({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading FAQ...">
      {(data) => (
        <>
          <StructuredData type="faq" data={{ faqItems: data.content.items }} />
          <FullscreenSection
            backgroundImage={data.hero.backgroundImage}
            title={data.hero.title}
            subtitle={data.hero.subtitle}
            buttonText={data.hero.buttonText}
            buttonHref={data.hero.buttonHref}
          />
          <FaqSection content={data.content} />
          <PageCTASection
            id="faq-cta"
            title={data.cta.title}
            subtitle={data.cta.subtitle}
            buttonText={data.cta.buttonText}
            buttonHref={data.cta.buttonHref}
          />
        </>
      )}
    </QueryWrapper>
  );
};
