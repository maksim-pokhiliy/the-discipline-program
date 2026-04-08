"use client";

import { Container, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <Stack
    sx={{
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: (theme) =>
        `radial-gradient(ellipse at 50% 20%, ${alpha(theme.palette.primary.main, 0.08)}, transparent 70%)`,
      backgroundColor: "background.default",
    }}
  >
    <Container maxWidth="sm">{children}</Container>
  </Stack>
);

export default AuthLayout;
