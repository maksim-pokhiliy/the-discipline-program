"use client";

import ArticleIcon from "@mui/icons-material/Article";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PersonIcon from "@mui/icons-material/Person";
import RateReviewIcon from "@mui/icons-material/RateReview";
import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Rating,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { DashboardActivityType, type ActivityItem } from "@repo/contracts/dashboard";
import { formatDate } from "@repo/shared";
import { ContentSection } from "@repo/ui";

interface RecentActivitySectionProps {
  activity: ActivityItem[];
}

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case DashboardActivityType.REVIEW:
      return <RateReviewIcon />;
    case DashboardActivityType.CONTACT:
      return <ContactMailIcon />;
    case DashboardActivityType.USER:
      return <PersonIcon />;
    case DashboardActivityType.BLOG_POST:
      return <ArticleIcon />;
    case DashboardActivityType.PROGRAM:
      return <FitnessCenterIcon />;
    default:
      return <PersonIcon />;
  }
};

const getActivityColor = (type: ActivityItem["type"]) => {
  switch (type) {
    case DashboardActivityType.REVIEW:
      return "primary.main";
    case DashboardActivityType.CONTACT:
      return "warning.main";
    case DashboardActivityType.USER:
      return "success.main";
    case DashboardActivityType.BLOG_POST:
      return "secondary.main";
    case DashboardActivityType.PROGRAM:
      return "info.main";
    default:
      return "grey.500";
  }
};

export const RecentActivitySection = ({ activity }: RecentActivitySectionProps) => {
  return (
    <ContentSection title="Recent Activity" surface="raised" maxWidth="xl">
      <List>
        {activity.length === 0 && (
          <ListItem>
            <ListItemText primary="No recent activity found" />
          </ListItem>
        )}

        {activity.map((item, index) => (
          <ListItemButton
            key={`${item.type}-${item.id}`}
            component={Link}
            href={item.href}
            divider={index < activity.length - 1}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: "transparent",
                  color: getActivityColor(item.type),
                  border: 1,
                  borderColor: getActivityColor(item.type),
                }}
              >
                {getActivityIcon(item.type)}
              </Avatar>
            </ListItemAvatar>

            <ListItemText
              primary={item.title}
              secondary={
                item.type === DashboardActivityType.REVIEW && item.rating ? (
                  <Rating value={item.rating} readOnly size="small" sx={{ mt: 0.5 }} />
                ) : (
                  item.subtitle
                )
              }
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {formatDate(item.date, "compact")}
              </Typography>
            </Box>
          </ListItemButton>
        ))}
      </List>
    </ContentSection>
  );
};
