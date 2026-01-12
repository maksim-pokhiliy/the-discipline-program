import { Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface HomeProgramsPreviewProps {
  programs: HomePageData["programs"];
  programsList: HomePageData["programsList"];
}

export const HomeProgramsPreview = ({ programs, programsList }: HomeProgramsPreviewProps) => {
  const previewPrograms = programsList.slice(0, 3);

  return (
    <ContentSection title={programs.title} subtitle={programs.subtitle}>
      <Grid container spacing={4}>
        {previewPrograms.map((program) => (
          <Grid key={program.id} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%", display: "flex" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <Stack spacing={4} alignItems="center" textAlign="center" sx={{ height: "100%" }}>
                  <Stack spacing={2}>
                    <Typography variant="h4" component="h3">
                      {program.title}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {program.description}
                    </Typography>
                  </Stack>

                  <Stack alignItems="center" spacing={0.5}>
                    <Typography variant="h3" color="text.primary">
                      {program.priceLabel ?? "$0"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  </Stack>

                  <Button variant="contained" fullWidth>
                    Get Started
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack alignItems="center" sx={{ mt: 10 }}>
        <Button variant="outlined" size="large" href="/programs">
          View All Programs
        </Button>
      </Stack>
    </ContentSection>
  );
};
