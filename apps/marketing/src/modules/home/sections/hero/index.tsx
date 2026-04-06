import { type HomePageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/lib/components/ui";

interface HomeHeroSectionProps {
  hero: HomePageData["hero"];
}

export const HomeHeroSection = ({ hero }: HomeHeroSectionProps) => {
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
