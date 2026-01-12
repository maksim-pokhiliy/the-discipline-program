import { Box, Grid, Stack, Typography } from "@mui/material";

import { type AboutPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface AboutJourneySectionProps {
  journey: AboutPageData["journey"];
}

export const AboutJourneySection = ({ journey }: AboutJourneySectionProps) => {
  return (
    <ContentSection title={journey.title} subtitle={journey.subtitle} backgroundColor="dark">
      <Box sx={{ position: "relative" }}>
        {/* Вертикальная линия (оставляем) */}
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
              {/* Блок с текстом (оставляем без изменений) */}
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

              <Grid size={{ xs: 12, md: 6 }} order={{ xs: 1, md: index % 2 === 0 ? 2 : 1 }} />
            </Grid>
          ))}
        </Stack>
      </Box>
    </ContentSection>
  );
};
