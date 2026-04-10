"use client";

import CheckIcon from "@mui/icons-material/Check";
import {
  alpha,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  type CardProps,
} from "@mui/material";

import { type Product, PRICE_INTERVAL_LABELS } from "@repo/contracts/cms/product";
import { formatPrice } from "@repo/shared";

type ProductCardProps = {
  product: Product;
  freeLabel: string;
  onAction: () => void;
  actionLabel?: string;
  variant?: "default" | "featured";
  cardVariant?: CardProps["variant"];
};

export const ProductCard = ({
  product,
  freeLabel,
  onAction,
  actionLabel = "Learn More",
  variant = "default",
  cardVariant = "elevation",
}: ProductCardProps) => {
  const activePrice = product.prices.find((p) => p.isActive);
  const isFeatured = variant === "featured" || product.isFeatured;

  return (
    <Card variant={cardVariant}>
      <Stack sx={{ width: "100%" }}>
        <Stack
          spacing={1}
          alignItems="center"
          sx={(theme) => ({
            p: 4,
            backgroundColor: isFeatured
              ? theme.palette.primary.main
              : theme.palette.background.default,
            color: isFeatured ? theme.palette.primary.contrastText : theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Typography variant="h5">{product.title}</Typography>

          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography variant="display2" component="p">
              {activePrice ? formatPrice(activePrice.amountCents, activePrice.currency) : freeLabel}
            </Typography>

            {activePrice && (
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: alpha(
                    isFeatured ? theme.palette.primary.contrastText : theme.palette.text.primary,
                    0.7,
                  ),
                })}
              >
                /{PRICE_INTERVAL_LABELS[activePrice.interval]}
              </Typography>
            )}
          </Stack>
        </Stack>

        <CardContent>
          <Stack spacing={3} justifyContent="space-between" sx={{ height: "100%" }}>
            <Stack spacing={3}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center" }}>
                {product.description}
              </Typography>

              {product.features.length > 0 && (
                <List disablePadding>
                  {product.features.map((feature) => (
                    <ListItem key={feature} disableGutters disablePadding>
                      <ListItemIcon sx={{ minWidth: (theme) => theme.spacing(4) }}>
                        <CheckIcon color={isFeatured ? "primary" : "success"} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        slotProps={{ primary: { variant: "body2" } }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Stack>

            <Stack alignItems="center">
              <Button
                variant={isFeatured ? "contained" : "outlined"}
                size="large"
                fullWidth
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Stack>
    </Card>
  );
};
