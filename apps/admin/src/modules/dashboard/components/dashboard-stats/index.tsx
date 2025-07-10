import {
  Psychology,
  RateReview,
  Article,
  AttachMoney,
  ContactMail,
  ShoppingCart,
} from "@mui/icons-material";
import { Typography, Grid, Paper, Stack, Box } from "@mui/material";
import { DashboardData } from "@repo/api";

interface DashboardStatsSectionProps {
  stats: DashboardData["stats"];
}

export const DashboardStatsSection = ({ stats }: DashboardStatsSectionProps) => {
  const statItems = [
    {
      title: "Programs",
      value: stats.programsCount,
      icon: <Psychology sx={{ fontSize: 32 }} />,
      color: "primary.main",
      bgColor: "primary.light",
    },
    {
      title: "Reviews",
      value: stats.reviewsCount,
      icon: <RateReview sx={{ fontSize: 32 }} />,
      color: "success.main",
      bgColor: "success.light",
    },
    {
      title: "Blog Posts",
      value: stats.blogPostsCount,
      icon: <Article sx={{ fontSize: 32 }} />,
      color: "info.main",
      bgColor: "info.light",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: <AttachMoney sx={{ fontSize: 32 }} />,
      color: "warning.main",
      bgColor: "warning.light",
    },
    {
      title: "Contacts",
      value: stats.contactsCount,
      icon: <ContactMail sx={{ fontSize: 32 }} />,
      color: "secondary.main",
      bgColor: "secondary.light",
    },
    {
      title: "Orders",
      value: stats.ordersCount,
      icon: <ShoppingCart sx={{ fontSize: 32 }} />,
      color: "error.main",
      bgColor: "error.light",
    },
  ];

  return (
    <Grid container spacing={3}>
      {statItems.map((item) => (
        <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: item.bgColor,
                opacity: 0.1,
              }}
            />

            <Stack spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "50%",
                  backgroundColor: item.bgColor,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {item.value}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {item.title}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};
