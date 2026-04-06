import { type SvgIconComponent } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

interface FeatureCardProps {
  icon: SvgIconComponent;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <Stack spacing={1.5}>
      <Icon sx={{ fontSize: 32, color: "text.secondary" }} />

      <Typography variant="h4" component="h3">
        {title}
      </Typography>

      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  );
};
