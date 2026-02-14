import { Button, Card, CardContent, Stack, Typography } from "@mui/material";

import { type Product } from "@repo/contracts/product";
import { PRICE_INTERVAL_LABELS } from "@repo/contracts/product";
import { formatPrice } from "@repo/shared";

interface StorefrontProgramCardProps {
  product: Product;
  onLearnMore: () => void;
}

export const StorefrontProgramCard = ({ product, onLearnMore }: StorefrontProgramCardProps) => {
  const activePrice = product.prices.find((p) => p.isActive);

  return (
    <Card sx={{ height: "100%", display: "flex" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <Stack spacing={2} sx={{ height: "100%", justifyContent: "space-between" }}>
          <Stack spacing={2}>
            <Typography variant="h4" component="h3">
              {product.title}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {product.description}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack alignItems="center" spacing={1}>
              <Typography variant="h2" color="primary">
                {activePrice ? formatPrice(activePrice.amountCents, activePrice.currency) : "Free"}
              </Typography>

              {activePrice && (
                <Typography variant="body2" color="text.secondary">
                  /{PRICE_INTERVAL_LABELS[activePrice.interval]}
                </Typography>
              )}
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
