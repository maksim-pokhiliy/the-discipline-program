import { type FaqPageData } from "@repo/contracts/pages";

import { PageCTASection } from "@app/lib/components/ui";

interface FaqCtaSectionProps {
  cta: FaqPageData["cta"];
}

export const FaqCtaSection = ({ cta }: FaqCtaSectionProps) => {
  return (
    <PageCTASection
      id="faq-cta"
      title={cta.title}
      subtitle={cta.subtitle}
      buttonText={cta.buttonText}
      buttonHref={cta.buttonHref}
    />
  );
};
