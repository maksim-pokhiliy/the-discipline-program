import { Grid, Card, CardContent, Typography, Stack } from "@mui/material";
import Link from "next/link";

import { ContentSection } from "@app/shared/components/ui/content-section";

import { quickActions } from "./data";

export const QuickActionsSection = () => {
  return (
    <ContentSection title="Quick Actions" backgroundColor="dark">
      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid key={action.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              component={Link}
              href={action.href}
              variant="outlined"
              sx={(theme) => ({
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textDecoration: "none",
                transition: theme.transitions.create(["background-color"], {
                  easing: theme.transitions.easing.easeInOut,
                  duration: theme.transitions.duration.short,
                }),
                "&:hover": {
                  bgcolor: theme.palette[action.color].main,
                  "& .action-icon": {
                    bgcolor: theme.palette.common.white,
                    color: `${theme.palette[action.color].main}`,
                  },
                  "& .action-title": {
                    color: theme.palette.common.white,
                  },
                  "& .action-description": {
                    color: theme.palette.common.white,
                    opacity: 0.9,
                  },
                },
              })}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Stack spacing={2} sx={{ alignItems: "center" }}>
                  <Stack
                    className="action-icon"
                    sx={(theme) => ({
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      backgroundColor: `${theme.palette[action.color].main}`,
                      color: `${theme.palette[action.color].contrastText}`,
                      alignItems: "center",
                      justifyContent: "center",
                      transition: theme.transitions.create(["background-color", "color"], {
                        easing: theme.transitions.easing.easeInOut,
                        duration: theme.transitions.duration.short,
                      }),
                    })}
                  >
                    {action.icon}
                  </Stack>

                  <Stack spacing={1} sx={{ textAlign: "center" }}>
                    <Typography
                      className="action-title"
                      variant="h6"
                      sx={(theme) => ({
                        fontWeight: 600,
                        transition: theme.transitions.create("color", {
                          easing: theme.transitions.easing.easeInOut,
                          duration: theme.transitions.duration.short,
                        }),
                      })}
                    >
                      {action.title}
                    </Typography>

                    <Typography
                      className="action-description"
                      variant="body2"
                      sx={(theme) => ({
                        color: "text.secondary",
                        transition: theme.transitions.create(["color", "opacity"], {
                          easing: theme.transitions.easing.easeInOut,
                          duration: theme.transitions.duration.short,
                        }),
                      })}
                    >
                      {action.description}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
