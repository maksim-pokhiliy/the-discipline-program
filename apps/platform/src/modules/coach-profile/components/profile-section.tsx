import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  type ChipProps,
  Stack,
  Typography,
} from "@mui/material";

type ProfileSectionProps = {
  title: string;
  badge?: { label: string; color: NonNullable<ChipProps["color"]> } | undefined;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  badge,
  action,
  children,
}) => (
  <Card>
    <CardHeader
      title={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h6">{title}</Typography>

          {badge && (
            <Chip size="small" variant="outlined" label={badge.label} color={badge.color} />
          )}
        </Stack>
      }
      {...(action !== undefined && { action })}
    />

    <CardContent>{children}</CardContent>
  </Card>
);
