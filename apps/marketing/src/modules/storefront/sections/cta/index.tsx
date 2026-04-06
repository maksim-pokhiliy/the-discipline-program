import { type StorefrontProgramsPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { CTASection } from "@app/lib/components/ui";

interface StorefrontProgramsCTAProps {
  cta: StorefrontProgramsPageData["cta"];
}

export const StorefrontProgramsCTA = ({ cta }: StorefrontProgramsCTAProps) => {
  return (
    <ContentSection id="storefront-cta" surface="raised">
      <CTASection
        title={cta.title}
        subtitle={cta.subtitle}
        buttonText={cta.buttonText}
        buttonHref={cta.buttonHref}
      />
    </ContentSection>
  );
};
