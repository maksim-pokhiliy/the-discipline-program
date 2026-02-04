import { type HomePageData } from "@repo/contracts/pages";

import { CTASection } from "@app/shared/components/ui";

interface HomeFinalCTASectionProps {
  contact: HomePageData["contact"];
}

export const HomeFinalCTASection = ({ contact }: HomeFinalCTASectionProps) => {
  return (
    <CTASection
      title={contact.title}
      subtitle={contact.subtitle}
      buttonText={contact.buttonText}
      buttonHref={contact.buttonHref}
    />
  );
};
