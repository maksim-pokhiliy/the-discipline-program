"use client";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { type Product, PRICE_INTERVAL_LABELS } from "@repo/contracts/product";
import { formatPrice } from "@repo/shared";

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export const ProductModal = ({ product, open, onClose }: ProductModalProps) => {
  const handleGetStarted = async () => {
    if (!product) {
      return;
    }
  };

  if (!product) {
    return null;
  }

  const activePrice = product.prices.find((p) => p.isActive);
  const displayPrice = activePrice
    ? formatPrice(activePrice.amountCents, activePrice.currency)
    : "Free";
  const displayInterval = activePrice ? PRICE_INTERVAL_LABELS[activePrice.interval] : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box
          maxWidth="lg"
          sx={(theme) => ({
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: "white",
            p: 6,
            position: "relative",
          })}
        >
          <IconButton
            onClick={onClose}
            sx={(theme) => ({
              position: "absolute",
              top: 20,
              right: 20,
              color: theme.palette.common.white,
              backgroundColor: alpha(theme.palette.common.white, 0.1),
              "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.2) },
            })}
          >
            <CloseIcon />
          </IconButton>

          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h2" sx={{ fontWeight: "bold" }}>
                {product.title}
              </Typography>

              <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: "70%" }}>
                {product.description}
              </Typography>
            </Stack>

            <Box>
              <Typography variant="display1" sx={{ fontWeight: "bold", display: "inline" }}>
                {displayPrice}
              </Typography>

              {displayInterval && (
                <Typography variant="h4" sx={{ opacity: 0.8, ml: 2, display: "inline" }}>
                  /{displayInterval}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 6 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={4}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  What&apos;s included in this program:
                </Typography>

                <Grid container spacing={2}>
                  {product.features.map((feature, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Stack
                          sx={(theme) => ({
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: "50%",
                            width: 24,
                            height: 24,
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            mt: 0.5,
                          })}
                        >
                          <CheckIcon sx={{ fontSize: 16, color: "white" }} />
                        </Stack>

                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {feature}
                        </Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: theme.shape.borderRadius,
                  p: 4,
                  border: `1px solid ${theme.palette.divider}`,
                  position: "sticky",
                  top: 20,
                })}
              >
                <Stack spacing={4} alignItems="center" textAlign="center">
                  <Stack>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: "bold" }}>
                      {displayPrice}
                    </Typography>

                    {displayInterval && (
                      <Typography variant="body2" color="text.secondary">
                        per {displayInterval}
                      </Typography>
                    )}
                  </Stack>

                  <Stack spacing={2} sx={{ width: "100%" }}>
                    <Button variant="contained" size="large" fullWidth onClick={handleGetStarted}>
                      Get Started Now
                    </Button>

                    <Button onClick={onClose} size="large" fullWidth>
                      Maybe Later
                    </Button>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                    Cancel anytime. No long-term commitments.
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
