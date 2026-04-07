import { type StorefrontProgramsPageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/lib/components/ui";

type StorefrontHeroSectionProps = {
  hero: StorefrontProgramsPageData["hero"];
};

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
