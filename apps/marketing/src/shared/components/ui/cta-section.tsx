import { Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

interface CtaSectionProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonHref: string;
}

export const CTASection = ({ title, subtitle, buttonText, buttonHref }: CtaSectionProps) => {
  return (
    <Container maxWidth="lg">
      <Stack
        spacing={4}
        sx={(theme) => ({
          alignItems: "center",
          textAlign: "center",
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderRadius: theme.shape.borderRadius,
          py: 10,
          px: 4,
        })}
      >
        <Stack spacing={2}>
          {subtitle && (
            <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 400 }}>
              {subtitle}
            </Typography>
          )}

          <Typography variant="display2" component="h2">
            {title}
          </Typography>
        </Stack>

        <Button
          component={Link}
          href={buttonHref}
          variant="contained"
          color="secondary"
          size="large"
        >
          {buttonText}
        </Button>
      </Stack>
    </Container>
  );
};
