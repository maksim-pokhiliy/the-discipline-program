import { Add, ContactMail, RateReview, Article, Assessment, Settings } from "@mui/icons-material";
import { Typography, Card, CardContent, Button, Grid, Stack, Badge, Box } from "@mui/material";
import { DashboardData } from "@repo/api";
import Link from "next/link";

interface QuickActionsSectionProps {
  quickStats: DashboardData["quickStats"];
}

export const QuickActionsSection = ({ quickStats }: QuickActionsSectionProps) => {
  const quickActions = [
    {
      title: "New Contacts",
      subtitle: "Review and respond",
      icon: <ContactMail sx={{ fontSize: 32 }} />,
      href: "/contacts",
      badge: quickStats.newContactsCount,
      color: "error" as const,
    },
    {
      title: "Add Review",
      subtitle: "Create testimonial",
      icon: <RateReview sx={{ fontSize: 32 }} />,
      href: "/reviews?action=create",
      color: "success" as const,
    },
    {
      title: "Write Article",
      subtitle: "Create blog post",
      icon: <Article sx={{ fontSize: 32 }} />,
      href: "/blog?action=create",
      badge: quickStats.unpublishedPostsCount,
      color: "warning" as const,
    },
    {
      title: "View Analytics",
      subtitle: "Performance stats",
      icon: <Assessment sx={{ fontSize: 32 }} />,
      href: "/analytics",
      color: "info" as const,
    },
    {
      title: "Add Program",
      subtitle: "Create new program",
      icon: <Add sx={{ fontSize: 32 }} />,
      href: "/programs?action=create",
      color: "primary" as const,
    },
    {
      title: "Settings",
      subtitle: "System config",
      icon: <Settings sx={{ fontSize: 32 }} />,
      href: "/settings",
      color: "secondary" as const,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Quick Actions
          </Typography>

          <Grid container spacing={2}>
            {quickActions.map((action) => (
              <Grid key={action.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  component={Link}
                  href={action.href}
                  variant="outlined"
                  fullWidth
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    borderColor: `${action.color}.main`,
                    color: `${action.color}.main`,
                    "&:hover": {
                      backgroundColor: `${action.color}.main`,
                      color: `${action.color}.contrastText`,
                      "& .MuiBadge-badge": {
                        backgroundColor: "white",
                        color: `${action.color}.main`,
                      },
                    },
                    position: "relative",
                  }}
                >
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge
                      badgeContent={action.badge}
                      color={action.color}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        "& .MuiBadge-badge": {
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        },
                      }}
                    />
                  )}

                  <Box sx={{ color: "inherit" }}>{action.icon}</Box>

                  <Stack spacing={0.5} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: "center" }}>
                      {action.title}
                    </Typography>

                    <Typography variant="caption" sx={{ opacity: 0.8, textAlign: "center" }}>
                      {action.subtitle}
                    </Typography>
                  </Stack>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};
