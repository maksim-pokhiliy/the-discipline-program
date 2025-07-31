import { Typography, Button } from "@mui/material";
import { AboutPageData } from "@repo/api";

import { FullscreenSection } from "@app/shared/components/ui/fullscreen-section";

interface AboutHeroSectionProps {
  hero: AboutPageData["hero"];
}

export const AboutHeroSection = ({ hero }: AboutHeroSectionProps) => {
  return (
    <FullscreenSection backgroundImage={hero.backgroundImage} maxWidth="lg">
      <Typography variant="h1" component="h1" textAlign="center">
        {hero.title}
      </Typography>

      <Typography variant="h5" sx={{ opacity: 0.9, textAlign: "center", maxWidth: "800px" }}>
        {hero.subtitle}
      </Typography>

      <Button variant="contained" size="large" href="#journey">
        Learn My Story
      </Button>
    </FullscreenSection>
  );
};
