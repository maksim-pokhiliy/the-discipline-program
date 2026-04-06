import { type StorefrontProgramsPageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/shared/components/ui";

interface StorefrontHeroSectionProps {
  hero: StorefrontProgramsPageData["hero"];
}

export const StorefrontHeroSection = ({ hero }: StorefrontHeroSectionProps) => {
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
