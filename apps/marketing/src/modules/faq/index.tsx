import { type FaqPageData } from "@repo/contracts/cms/pages";

import { StructuredData } from "@app/lib/components/seo";
import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";

import { FaqSection } from "./sections";

type FaqPageContentProps = {
  data: FaqPageData;
};

export const FaqPageContent = ({ data }: FaqPageContentProps) => (
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
);
