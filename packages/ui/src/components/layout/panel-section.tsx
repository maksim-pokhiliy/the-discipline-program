"use client";

import { type ReactNode } from "react";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";

export interface PanelSectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export const PanelSection = ({ title, children, action }: PanelSectionProps) => {
  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 8,
      }}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        })}
      >
        <Stack spacing={3}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>

            {action && <Box>{action}</Box>}
          </Stack>

          <Box>{children}</Box>
        </Stack>
      </Paper>
    </Container>
  );
};
