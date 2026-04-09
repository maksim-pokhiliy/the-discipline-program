"use client";

import CheckIcon from "@mui/icons-material/Check";
import { Button, Grid, Stack, Typography } from "@mui/material";

import { type Product, PRICE_INTERVAL_LABELS } from "@repo/contracts/product";
import { formatPrice } from "@repo/shared";
import { BaseModal } from "@repo/ui";

type ProductModalProps = {
  product: Product | null;
  freeLabel: string;
  dismissLabel: string;
  actionLabel: string;
  open: boolean;
  onClose: () => void;
  onGetStarted?: () => void;
};

export const ProductModal = ({
  product,
  freeLabel,
  dismissLabel,
  actionLabel,
  open,
  onClose,
  onGetStarted,
}: ProductModalProps) => {
  if (!product) {
    return null;
  }

  const activePrice = product.prices.find((p) => p.isActive);
  const displayPrice = activePrice
    ? formatPrice(activePrice.amountCents, activePrice.currency)
    : freeLabel;
  const displayInterval = activePrice ? PRICE_INTERVAL_LABELS[activePrice.interval] : null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={product.title}
      actions={
        <Stack direction="row" spacing={3} sx={{ alignItems: "center", width: "100%" }}>
          <Button variant="text" size="large" fullWidth onClick={onClose}>
            {dismissLabel}
          </Button>

          <Button variant="contained" size="large" fullWidth onClick={onGetStarted ?? onClose}>
            {actionLabel}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Stack direction="row" sx={{ alignItems: "baseline" }} spacing={1}>
          <Typography variant="display2" component="p">
            {displayPrice}
          </Typography>

          {displayInterval && (
            <Typography variant="h4" color="text.secondary">
              /{displayInterval}
            </Typography>
          )}
        </Stack>

        <Typography variant="h5" color="text.secondary">
          {product.description}
        </Typography>

        {product.features.length > 0 && (
          <Grid container spacing={0.2}>
            {product.features.map((feature) => (
              <Grid
                key={feature}
                size={{ xs: 12, sm: 6 }}
                sx={(theme) => ({ backgroundColor: theme.palette.background.paper })}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 2 }}>
                  <CheckIcon color="primary" fontSize="small" />
                  <Typography>{feature}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </BaseModal>
  );
};
