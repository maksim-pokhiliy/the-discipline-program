import { type StorefrontProgramsPageData } from "@repo/contracts/pages";

import { CTASection } from "@app/shared/components/ui";

interface StorefrontProgramsCTAProps {
  cta: StorefrontProgramsPageData["cta"];
}

export const StorefrontProgramsCTA = ({ cta }: StorefrontProgramsCTAProps) => {
  return (
    <CTASection
      title={cta.title}
      subtitle={cta.subtitle}
      buttonText={cta.buttonText}
      buttonHref={cta.buttonHref}
    />
  );
};
