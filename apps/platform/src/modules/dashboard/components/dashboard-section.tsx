import {
  Chip,
  type ChipProps,
  Card,
  Stack,
  Typography,
  CardContent,
  CardHeader,
} from "@mui/material";

type DashboardSectionProps = {
  title: string;
  badge?: { label: string | number; color: ChipProps["color"] };
  children: React.ReactNode;
};

export const DashboardSection: React.FC<DashboardSectionProps> = ({ title, badge, children }) => (
  <Card>
    <CardHeader
      title={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h6">{title}</Typography>
          {badge && <Chip size="small" label={badge.label} color={badge.color} />}
        </Stack>
      }
    />

    <CardContent>{children}</CardContent>
  </Card>
);
