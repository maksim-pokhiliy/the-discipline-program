import { BlogPageData } from "@repo/api";
import { ContentSection } from "@repo/ui";

interface BlogHeroSectionProps {
  hero: BlogPageData["hero"];
}

export const BlogHeroSection = ({ hero }: BlogHeroSectionProps) => {
  return <ContentSection title={hero.title} subtitle={hero.subtitle} backgroundColor="dark" />;
};
