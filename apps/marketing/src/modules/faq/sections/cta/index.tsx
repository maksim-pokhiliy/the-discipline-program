import { type FaqPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { CTASection } from "@app/shared/components/ui";

interface FaqCtaSectionProps {
  cta: FaqPageData["cta"];
}

export const FaqCtaSection = ({ cta }: FaqCtaSectionProps) => {
  return (
    <ContentSection id="faq-cta" surface="raised">
      <CTASection
        title={cta.title}
        subtitle={cta.subtitle}
        buttonText={cta.buttonText}
        buttonHref={cta.buttonHref}
      />
    </ContentSection>
  );
};
