import { type HomePageData } from "@repo/contracts/pages";

import { PageCTASection } from "@app/lib/components/ui";

interface HomeFinalCTASectionProps {
  contact: HomePageData["contact"];
}

export const HomeFinalCTASection = ({ contact }: HomeFinalCTASectionProps) => {
  return (
    <PageCTASection
      id="home-cta"
      title={contact.title}
      subtitle={contact.subtitle}
      buttonText={contact.buttonText}
      buttonHref={contact.buttonHref}
    />
  );
};
