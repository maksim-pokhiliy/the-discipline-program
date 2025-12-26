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
import { Program } from "@repo/api";

import { usePayment } from "@app/lib/hooks";

interface ProgramModalProps {
  program: Program | null;
  open: boolean;
  onClose: () => void;
}

export const ProgramModal = ({ program, open, onClose }: ProgramModalProps) => {
  const { createPayment, isLoading: isCreatingPayment } = usePayment({
    onError: (error) => {
      console.error("Payment creation failed:", error);
    },
  });

  const handleGetStarted = async () => {
    if (!program) {
      return;
    }

    await createPayment({
      programId: program.id,
      customerEmail: "test@example.com",
      customerName: "Test User",
    });
  };

  if (!program) {
    return null;
  }

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
                {program.name}
              </Typography>

              <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: "70%" }}>
                {program.description}
              </Typography>
            </Stack>

            <Box>
              <Typography variant="h1" sx={{ fontWeight: "bold", display: "inline" }}>
                ${program.price}
              </Typography>

              <Typography variant="h4" sx={{ opacity: 0.8, ml: 2, display: "inline" }}>
                /month
              </Typography>
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
                  {program.features.map((feature, index) => (
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
                      ${program.price}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      per month
                    </Typography>
                  </Stack>

                  <Stack spacing={2} sx={{ width: "100%" }}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{ py: 2 }}
                      onClick={handleGetStarted}
                      disabled={isCreatingPayment}
                    >
                      {isCreatingPayment ? "Creating Payment..." : "Get Started Now"}
                    </Button>

                    <Button variant="outlined" onClick={onClose} size="large" fullWidth>
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
