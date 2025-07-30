import { Box, Typography, Stack, Grid } from "@mui/material";
import { AboutPageData } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui/content-section";

interface AboutJourneySectionProps {
  journey: AboutPageData["journey"];
}

export const AboutJourneySection = ({ journey }: AboutJourneySectionProps) => {
  return (
    <ContentSection title={journey.title} subtitle={journey.subtitle} backgroundColor="dark">
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            left: { xs: 20, md: "50%" },
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: "primary.main",
            transform: { md: "translateX(-50%)" },
          }}
        />

        <Stack spacing={6}>
          {journey.timeline.map((item, index) => (
            <Grid container key={index} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }} order={{ xs: 2, md: index % 2 === 0 ? 1 : 2 }}>
                <Box
                  sx={{
                    pl: { xs: 6, md: index % 2 === 0 ? 0 : 4 },
                    pr: { xs: 0, md: index % 2 === 0 ? 4 : 0 },
                    textAlign: { xs: "left", md: index % 2 === 0 ? "right" : "left" },
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                      {item.year}
                    </Typography>

                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {item.description}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} order={{ xs: 1, md: index % 2 === 0 ? 2 : 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "flex-start", md: "center" },
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "primary.main",
                      borderRadius: "50%",
                      border: "4px solid",
                      borderColor: "background.paper",
                      position: { xs: "absolute", md: "relative" },
                      left: { xs: 12, md: "auto" },
                      top: { xs: 8, md: "auto" },
                      zIndex: 1,
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          ))}
        </Stack>
      </Box>
    </ContentSection>
  );
};
