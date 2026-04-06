import { type FaqPageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/shared/components/ui";

interface FaqHeroSectionProps {
  hero: FaqPageData["hero"];
}

export const FaqHeroSection = ({ hero }: FaqHeroSectionProps) => {
  return (
    <FullscreenSection
      backgroundImage={hero.backgroundImage}
      title={hero.title}
      subtitle={hero.subtitle}
      buttonText={hero.buttonText}
      buttonHref={hero.buttonHref}
    />
  );
};
