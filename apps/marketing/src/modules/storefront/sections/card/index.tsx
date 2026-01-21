import { Button, Card, CardContent, Stack, Typography } from "@mui/material";

import { type StorefrontProgram } from "@repo/contracts/storefront";

interface StorefrontProgramCardProps {
  program: StorefrontProgram;
  onLearnMore: () => void;
}

export const StorefrontProgramCard = ({ program, onLearnMore }: StorefrontProgramCardProps) => {
  return (
    <Card sx={{ height: "100%", display: "flex" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <Stack spacing={2} sx={{ height: "100%", justifyContent: "space-between" }}>
          <Stack spacing={2}>
            <Typography variant="h4" component="h3">
              {program.title}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {program.description}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack alignItems="center" spacing={1}>
              <Typography variant="h2" color="primary">
                {program.priceLabel ?? "$0"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                /month
              </Typography>
            </Stack>

            <Button variant="contained" size="large" onClick={onLearnMore}>
              Learn More
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
