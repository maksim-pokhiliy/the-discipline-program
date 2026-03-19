import * as MuiIcons from "@mui/icons-material";
import { Box, Card, CardContent, Grid, Stack, Typography, alpha } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface FeaturesSectionProps {
  whyChoose: HomePageData["whyChoose"];
}

export const HomeFeaturesSection = ({ whyChoose }: FeaturesSectionProps) => {
  return (
    <ContentSection title={whyChoose.title} subtitle={whyChoose.subtitle} backgroundColor="dark">
      <Grid container spacing={4}>
        {whyChoose.features.map((feature) => {
          const IconComponent = MuiIcons[feature.iconName as keyof typeof MuiIcons];

          return (
            <Grid key={feature.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-start" }}>
                    <Box
                      sx={(theme) => ({
                        width: 48,
                        height: 48,
                        minWidth: 48,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      })}
                    >
                      {IconComponent && (
                        <IconComponent
                          sx={(theme) => ({
                            fontSize: theme.typography.pxToRem(24),
                            color: theme.palette.primary.main,
                          })}
                        />
                      )}
                    </Box>

                    <Stack spacing={0.75}>
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
