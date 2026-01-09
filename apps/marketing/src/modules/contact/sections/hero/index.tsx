import { type ContactPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface ContactHeroProps {
  hero: ContactPageData["hero"];
}

export const ContactHero = ({ hero }: ContactHeroProps) => {
  return <ContentSection title={hero.title} subtitle={hero.subtitle} backgroundColor="dark" />;
};
