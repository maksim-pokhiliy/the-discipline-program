import { type AboutPageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/lib/components/ui";

type AboutHeroSectionProps = {
  hero: AboutPageData["hero"];
};

export const AboutHeroSection = ({ hero }: AboutHeroSectionProps) => {
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
