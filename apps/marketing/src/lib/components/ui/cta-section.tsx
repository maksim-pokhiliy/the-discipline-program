import { alpha, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

type CtaSectionProps = {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonHref: string;
};

export const CTASection = ({ title, subtitle, buttonText, buttonHref }: CtaSectionProps) => {
  return (
    <Stack
      spacing={4}
      alignItems="center"
      sx={(theme) => ({
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
          <Typography
            variant="h4"
            sx={(theme) => ({ color: alpha(theme.palette.primary.contrastText, 0.85) })}
          >
            {subtitle}
          </Typography>
        )}

        <Typography variant="display2" component="h2">
          {title}
        </Typography>
      </Stack>

      <Button component={Link} href={buttonHref} variant="contained" color="secondary" size="large">
        {buttonText}
      </Button>
    </Stack>
  );
};
