import { type ContactPageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/lib/components/ui";

type ContactHeroProps = {
  hero: ContactPageData["hero"];
};

export const ContactHero = ({ hero }: ContactHeroProps) => {
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
