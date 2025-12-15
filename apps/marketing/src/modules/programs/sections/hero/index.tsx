import { ProgramsPageData } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui";

interface ProgramsHeroSectionProps {
  hero: ProgramsPageData["hero"];
}

export const ProgramsHeroSection = ({ hero }: ProgramsHeroSectionProps) => (
  <ContentSection title={hero.title} subtitle={hero.subtitle} backgroundColor="dark" />
);
