import { Button, Typography } from "@mui/material";
import Link from "next/link";

import { type HomePageData } from "@repo/contracts/pages";

import { FullscreenSection } from "@app/shared/components/ui";

interface HomeHeroSectionProps {
  hero: HomePageData["hero"];
}

export const HomeHeroSection = ({ hero }: HomeHeroSectionProps) => {
  return (
    <FullscreenSection backgroundImage={hero.backgroundImage} overlayVariant="gradient" offset={1}>
      <Typography variant="display1" component="h1">
        {hero.title}
      </Typography>

      <Typography
        variant="h3"
        component="p"
        sx={{ opacity: 0.7, fontWeight: 400, maxWidth: { xs: "100%", md: 550 } }}
      >
        {hero.subtitle}
      </Typography>

      <Button component={Link} href={hero.buttonHref ?? ""} variant="contained" size="large">
        {hero.buttonText}
      </Button>
    </FullscreenSection>
  );
};
