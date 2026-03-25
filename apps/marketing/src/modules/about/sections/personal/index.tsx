import { Box, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";

import { type AboutPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface AboutPersonalSectionProps {
  personal: AboutPageData["personal"];
}

export const AboutPersonalSection = ({ personal }: AboutPersonalSectionProps) => {
  return (
    <ContentSection title={personal.title} subtitle={personal.subtitle}>
      <Grid container spacing={8} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={(theme) => ({
              position: "relative",
              overflow: "hidden",
              aspectRatio: "1/1",
              borderRadius: theme.shape.borderRadius,
            })}
          >
            <Image
              src={personal.image}
              alt={personal.name}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              fill
              style={{
                objectFit: "cover",
                filter: "brightness(1.1) contrast(1.1)",
              }}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={4}>
            <Typography
              variant="h3"
              sx={{
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              &quot;{personal.description}&quot;
            </Typography>

            <Box>
              <Typography variant="h2" sx={{ fontWeight: 600 }}>
                {personal.name}
              </Typography>

              <Typography variant="h3" color="primary" sx={{ fontWeight: 500 }}>
                {personal.role}
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </ContentSection>
  );
};
