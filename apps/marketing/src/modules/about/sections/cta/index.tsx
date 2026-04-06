import { type AboutPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { CTASection } from "@app/lib/components/ui";

interface AboutCtaSectionProps {
  cta: AboutPageData["cta"];
}

export const AboutCTASection = ({ cta }: AboutCtaSectionProps) => {
  return (
    <ContentSection id="about-cta" surface="raised">
      <CTASection
        title={cta.title}
        subtitle={cta.subtitle}
        buttonText={cta.buttonText}
        buttonHref={cta.buttonHref}
      />
    </ContentSection>
  );
};
