import { AboutPageData } from "@repo/api";

import { CTASection } from "@app/shared/components/ui";

interface AboutCtaSectionProps {
  cta: AboutPageData["cta"];
}

export const AboutCTASection = ({ cta }: AboutCtaSectionProps) => {
  return (
    <CTASection
      title={cta.title}
      subtitle={cta.subtitle}
      buttonText={cta.buttonText}
      buttonHref={cta.buttonHref}
      backgroundColor="dark"
    />
  );
};
