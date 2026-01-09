import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import { type AboutPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface AboutCredentialsSectionProps {
  credentials: AboutPageData["credentials"];
}

export const AboutCredentialsSection = ({ credentials }: AboutCredentialsSectionProps) => {
  return (
    <ContentSection title={credentials.title}>
      <Grid container spacing={4}>
        {credentials.items.map((item, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card
              sx={{
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      backgroundColor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" color="white" fontWeight="bold">
                      {index + 1}
                    </Typography>
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      minHeight: 48,
                    }}
                  >
                    {item}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
