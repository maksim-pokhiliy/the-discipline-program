import { type StorefrontProgramsPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface StorefrontProgramsHeroSectionProps {
  hero: StorefrontProgramsPageData["hero"];
}

export const StorefrontProgramsHeroSection = ({ hero }: StorefrontProgramsHeroSectionProps) => (
  <ContentSection title={hero.title} subtitle={hero.subtitle} backgroundColor="dark" />
);
