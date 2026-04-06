import { type HomePageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { CTASection } from "@app/lib/components/ui";

interface HomeFinalCTASectionProps {
  contact: HomePageData["contact"];
}

export const HomeFinalCTASection = ({ contact }: HomeFinalCTASectionProps) => {
  return (
    <ContentSection id="home-cta" surface="raised">
      <CTASection
        title={contact.title}
        subtitle={contact.subtitle}
        buttonText={contact.buttonText}
        buttonHref={contact.buttonHref}
      />
    </ContentSection>
  );
};
