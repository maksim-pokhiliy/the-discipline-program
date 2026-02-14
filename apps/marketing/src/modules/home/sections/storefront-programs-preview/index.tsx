import { Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { PRICE_INTERVAL_LABELS } from "@repo/contracts/product";
import { formatPrice } from "@repo/shared";
import { ContentSection } from "@repo/ui";

interface HomeProgramsPreviewProps {
  programs: HomePageData["storefront"];
  productsList: HomePageData["productsList"];
}

export const HomeStorefrontProgramsPreview = ({
  programs,
  productsList,
}: HomeProgramsPreviewProps) => {
  const previewProducts = productsList.slice(0, 3);

  return (
    <ContentSection title={programs.title} subtitle={programs.subtitle}>
      <Grid container spacing={4}>
        {previewProducts.map((product) => {
          const activePrice = product.prices.find((p) => p.isActive);

          return (
            <Grid key={product.id} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: "100%", display: "flex" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <Stack spacing={4} alignItems="center" textAlign="center" sx={{ height: "100%" }}>
                    <Stack spacing={2}>
                      <Typography variant="h4" component="h3">
                        {product.title}
                      </Typography>

                      <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
                        {product.description}
                      </Typography>
                    </Stack>

                    <Stack alignItems="center" spacing={0.5}>
                      <Typography variant="h3" color="text.primary">
                        {activePrice
                          ? formatPrice(activePrice.amountCents, activePrice.currency)
                          : "Free"}
                      </Typography>

                      {activePrice && (
                        <Typography variant="body2" color="text.secondary">
                          /{PRICE_INTERVAL_LABELS[activePrice.interval]}
                        </Typography>
                      )}
                    </Stack>

                    <Button variant="contained" fullWidth>
                      Get Started
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Stack alignItems="center" sx={{ mt: 10 }}>
        <Button variant="outlined" size="large" href="/storefront">
          View All Programs
        </Button>
      </Stack>
    </ContentSection>
  );
};
