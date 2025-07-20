import { Typography, Button } from "@mui/material";
import { HomePageData } from "@repo/api";
import Link from "next/link";

import { FullscreenSection } from "@app/shared/components/ui/fullscreen-section";

interface HomeHeroSectionProps {
  hero: HomePageData["hero"];
}

export const HomeHeroSection = ({ hero }: HomeHeroSectionProps) => {
  return (
    <FullscreenSection backgroundImage={hero.backgroundImage} maxWidth="lg">
      <Typography variant="h1" component="h1">
        {hero.title}
      </Typography>

      <Typography variant="h5" sx={{ opacity: 0.8 }}>
        {hero.subtitle}
      </Typography>

      <Button component={Link} href={hero.ctaHref} variant="contained" size="large">
        {hero.ctaText}
      </Button>
    </FullscreenSection>
  );
};
