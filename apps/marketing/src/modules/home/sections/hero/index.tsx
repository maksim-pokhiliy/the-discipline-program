import { Button, Typography } from "@mui/material";
import Link from "next/link";

import { type HomePageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/shared/components/ui";

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

      <Button component={Link} href={hero.buttonHref ?? ""} variant="contained" size="large">
        {hero.buttonText}
      </Button>
    </FullscreenSection>
  );
};
