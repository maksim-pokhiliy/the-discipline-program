import { type FaqPageData } from "@repo/contracts/cms/pages";

import { StructuredData } from "@app/lib/components/seo";
import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";

import { FaqSection } from "./sections";

type FaqPageContentProps = {
  data: FaqPageData;
};

export const FaqPageContent = ({ data }: FaqPageContentProps) => (
  <>
    {data.content && <StructuredData type="faq" data={{ faqItems: data.content.items }} />}

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

    {data.content && <FaqSection content={data.content} />}

    {data.cta && (
      <PageCTASection
        id="faq-cta"
        title={data.cta.title}
        subtitle={data.cta.subtitle}
        buttonText={data.cta.buttonText}
        buttonHref={data.cta.buttonHref}
      />
    )}
  </>
);
