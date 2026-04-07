"use client";

import { type ReactNode } from "react";

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

const ACTIVITY_CONFIG: Record<DashboardActivityType, { icon: ReactNode; color: string }> = {
  [DashboardActivityType.REVIEW]: { icon: <RateReviewIcon />, color: "primary.main" },
  [DashboardActivityType.CONTACT]: { icon: <ContactMailIcon />, color: "warning.main" },
  [DashboardActivityType.USER]: { icon: <PersonIcon />, color: "success.main" },
  [DashboardActivityType.BLOG_POST]: { icon: <ArticleIcon />, color: "secondary.main" },
  [DashboardActivityType.PROGRAM]: { icon: <FitnessCenterIcon />, color: "info.main" },
};

const DEFAULT_ACTIVITY = { icon: <PersonIcon />, color: "grey.500" };

interface RecentActivitySectionProps {
  activity: ActivityItem[];
}

export const RecentActivitySection = ({ activity }: RecentActivitySectionProps) => {
  return (
    <ContentSection title="Recent Activity" surface="raised" maxWidth="xl">
      <List>
        {activity.length === 0 && (
          <ListItem>
            <ListItemText primary="No recent activity found" />
          </ListItem>
        )}

        {activity.map((item, index) => {
          const config = ACTIVITY_CONFIG[item.type] ?? DEFAULT_ACTIVITY;

          return (
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
                    color: config.color,
                    border: 1,
                    borderColor: config.color,
                  }}
                >
                  {config.icon}
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
          );
        })}
      </List>
    </ContentSection>
  );
};
