import * as MuiIcons from "@mui/icons-material";
import { type SvgIconComponent } from "@mui/icons-material";
import { Grid } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { FeatureCard } from "@app/lib/components/ui";

const isSvgIconComponent = (value: unknown): value is SvgIconComponent =>
  typeof value === "function";

interface FeaturesSectionProps {
  whyChoose: HomePageData["whyChoose"];
}

export const HomeFeaturesSection = ({ whyChoose }: FeaturesSectionProps) => {
  return (
    <ContentSection id="why-choose" title={whyChoose.title} subtitle={whyChoose.subtitle}>
      <Grid container spacing={6}>
        {whyChoose.features.map((feature) => {
          const candidate =
            feature.iconName in MuiIcons
              ? MuiIcons[feature.iconName as keyof typeof MuiIcons]
              : undefined;

          if (!isSvgIconComponent(candidate)) {
            return null;
          }

          return (
            <Grid key={feature.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <FeatureCard
                icon={candidate}
                title={feature.title}
                description={feature.description}
              />
            </Grid>
          );
        })}
      </Grid>
    </ContentSection>
  );
};
