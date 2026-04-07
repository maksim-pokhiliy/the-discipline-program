import { type AboutPageData } from "@repo/contracts/pages";

import { PageCTASection } from "@app/lib/components/ui";

interface AboutCtaSectionProps {
  cta: AboutPageData["cta"];
}

export const AboutCTASection = ({ cta }: AboutCtaSectionProps) => {
  return (
    <PageCTASection
      id="about-cta"
      title={cta.title}
      subtitle={cta.subtitle}
      buttonText={cta.buttonText}
      buttonHref={cta.buttonHref}
    />
  );
};
