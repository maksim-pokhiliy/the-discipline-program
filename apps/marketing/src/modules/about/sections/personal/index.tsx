import { Box, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";

import { type AboutPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface AboutPersonalSectionProps {
  personal: AboutPageData["personal"];
}

export const AboutPersonalSection = ({ personal }: AboutPersonalSectionProps) => {
  return (
    <ContentSection title={personal?.title} backgroundColor="dark">
      <Grid container spacing={8} alignItems="center">
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            sx={(theme) => ({
              position: "relative",
              overflow: "hidden",
              aspectRatio: "4/5",
              borderRadius: theme.shape.borderRadius,
            })}
          >
            {personal?.image && (
              <Image
                src={personal.image}
                alt="Denis with Chekhov"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                fill
                style={{
                  objectFit: "cover",
                  filter: "brightness(1.1) contrast(1.1)",
                }}
              />
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={4}>
            <Typography
              variant="h6"
              sx={{
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              &quot;{personal?.description}&quot;
            </Typography>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Denis Sergeev
              </Typography>

              <Typography variant="body1" color="primary" sx={{ fontWeight: 500 }}>
                Founder, The Discipline Program
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </ContentSection>
  );
};
