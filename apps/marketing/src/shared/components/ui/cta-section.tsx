import { Typography, Button, Box, Container, Stack } from "@mui/material";

interface CtaSectionProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
  backgroundColor?: "light" | "dark";
}

export const CTASection = ({ title, subtitle, buttonText, buttonHref }: CtaSectionProps) => {
  return (
    <Box
      sx={(theme) => ({
        py: 12,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: theme.palette.common.white,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      })}
    >
      <Container maxWidth="md">
        <Stack spacing={8} sx={{ alignItems: "center", position: "relative", zIndex: 1 }}>
          <Stack spacing={4} sx={{ maxWidth: "800px" }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 800,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                opacity: 0.95,
                lineHeight: 1.5,
                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            >
              {subtitle}
            </Typography>
          </Stack>

          <Button
            variant="contained"
            size="large"
            href={buttonHref}
            sx={(theme) => ({
              backgroundColor: theme.palette.common.white,
              color: theme.palette.primary.main,
              fontWeight: 700,
              fontSize: theme.typography.pxToRem(20),
              py: 3,
              px: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: theme.palette.grey[50],
                transform: "translateY(-4px)",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
              },
            })}
          >
            {buttonText}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};
