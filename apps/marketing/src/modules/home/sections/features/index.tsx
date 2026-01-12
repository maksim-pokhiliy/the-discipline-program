import * as MuiIcons from "@mui/icons-material";
import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface FeaturesSectionProps {
  whyChoose: HomePageData["whyChoose"];
  features: HomePageData["features"];
}

export const HomeFeaturesSection = ({ whyChoose, features }: FeaturesSectionProps) => {
  return (
    <ContentSection title={whyChoose.title} subtitle={whyChoose.subtitle} backgroundColor="dark">
      <Grid container spacing={4}>
        {features.map((feature) => {
          const IconComponent = MuiIcons[feature.iconName as keyof typeof MuiIcons];

          return (
            <Grid key={feature.id} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Stack spacing={4} textAlign="center" alignItems="center">
                    {IconComponent && (
                      <IconComponent
                        sx={(theme) => ({
                          fontSize: theme.typography.pxToRem(48),
                          color: theme.palette.primary.main,
                        })}
                      />
                    )}

                    <Stack spacing={2}>
                      <Typography variant="h4" component="h3">
                        {feature.title}
                      </Typography>

                      <Typography variant="body1" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </ContentSection>
  );
};
