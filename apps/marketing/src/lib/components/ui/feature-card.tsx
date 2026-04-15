import { type SvgIconComponent } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

type FeatureCardProps = {
  icon: SvgIconComponent;
  title: string;
  description: string;
};

export const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <Stack spacing={1.5}>
      <Icon fontSize="large" sx={{ color: "text.secondary" }} />

      <Typography variant="h4" component="h3">
        {title}
      </Typography>

      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  );
};
