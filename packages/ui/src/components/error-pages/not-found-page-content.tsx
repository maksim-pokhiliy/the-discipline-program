import { Button, Stack, Typography } from "@mui/material";

export type NotFoundPageContentProps = {
  homeLabel?: string;
};

export const NotFoundPageContent = ({ homeLabel = "Go home" }: NotFoundPageContentProps) => (
  <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "60vh", py: 4 }}>
    <Typography variant="display2" color="text.disabled">
      404
    </Typography>

    <Typography variant="h4" color="text.secondary" sx={{ mt: 2 }}>
      Page not found
    </Typography>

    <Button variant="contained" href="/" sx={{ mt: 4 }}>
      {homeLabel}
    </Button>
  </Stack>
);
