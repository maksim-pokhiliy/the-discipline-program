// apps/admin/src/modules/dashboard/components/recent-activity/index.tsx
import {
  ContactMail,
  ShoppingCart,
  RateReview,
  Article,
  OpenInNew,
  Star,
} from "@mui/icons-material";
import {
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Stack,
  IconButton,
} from "@mui/material";
import { RecentActivityItem } from "@repo/api";
import Link from "next/link";

interface RecentActivitySectionProps {
  activities: RecentActivityItem[];
}

const getActivityIcon = (type: RecentActivityItem["type"]) => {
  switch (type) {
    case "contact":
      return <ContactMail />;
    case "order":
      return <ShoppingCart />;
    case "review":
      return <RateReview />;
    case "blog":
      return <Article />;
    default:
      return <ContactMail />;
  }
};

const getActivityColor = (type: RecentActivityItem["type"], status?: string) => {
  switch (type) {
    case "contact":
      return status === "NEW" ? "error" : "info";
    case "order":
      return status === "COMPLETED" ? "success" : "warning";
    case "review":
      return "success";
    case "blog":
      return status === "published" ? "success" : "warning";
    default:
      return "default";
  }
};

const getStatusChip = (item: RecentActivityItem) => {
  if (!item.status) return null;

  const getChipProps = () => {
    switch (item.type) {
      case "contact":
        return {
          color: item.status === "NEW" ? ("error" as const) : ("info" as const),
          label: item.status,
        };
      case "order":
        return {
          color: item.status === "COMPLETED" ? ("success" as const) : ("warning" as const),
          label: item.status,
        };
      case "blog":
        return {
          color: item.status === "published" ? ("success" as const) : ("warning" as const),
          label: item.status === "published" ? "LIVE" : "DRAFT",
        };
      default:
        return { color: "default" as const, label: item.status };
    }
  };

  const chipProps = getChipProps();

  return <Chip size="small" {...chipProps} />;
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return past.toLocaleDateString();
};

export const RecentActivitySection = ({ activities }: RecentActivitySectionProps) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Recent Activity
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Last 15 events
            </Typography>
          </Stack>

          {activities.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {activities.map((item, index) => (
                <ListItem
                  key={item.id}
                  sx={{
                    px: 0,
                    py: 2,
                    borderBottom: index < activities.length - 1 ? "1px solid" : "none",
                    borderColor: "divider",
                    alignItems: "flex-start",
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: `${getActivityColor(item.type, item.status)}.main`,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getActivityIcon(item.type)}
                    </Avatar>
                  </ListItemAvatar>

                  <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.title}
                        </Typography>

                        {item.rating && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Star sx={{ fontSize: 16, color: "warning.main" }} />
                            <Typography variant="caption" color="warning.main">
                              {item.rating}
                            </Typography>
                          </Stack>
                        )}

                        {getStatusChip(item)}
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                          {item.subtitle}
                        </Typography>

                        <Typography variant="caption" color="text.disabled">
                          {formatTimeAgo(item.timestamp)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  {item.href && (
                    <IconButton
                      component={Link}
                      href={item.href}
                      size="small"
                      color="primary"
                      sx={{ opacity: 0.7, "&:hover": { opacity: 1 }, ml: 1 }}
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
