import { ContactPageData } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui/content-section";

interface ContactHeroProps {
  hero: ContactPageData["hero"];
}

export const ContactHero = ({ hero }: ContactHeroProps) => {
  return <ContentSection title={hero.title} subtitle={hero.subtitle} backgroundColor="dark" />;
};
