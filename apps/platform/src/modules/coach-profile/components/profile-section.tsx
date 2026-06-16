import { Chip, Stack, Typography } from "@mui/material";

type ProfileSectionProps = {
  title: string;
  count?: number | undefined;
  meta?: string | undefined;
  subline?: React.ReactNode | undefined;
  children: React.ReactNode;
};

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  count,
  meta,
  subline,
  children,
}) => (
  <Stack spacing={1.25}>
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      flexWrap="wrap"
      sx={{ rowGap: 0.5, px: 0.25 }}
    >
      <Typography variant="h4">{title}</Typography>

      {count !== undefined && <Chip label={count} size="small" />}

      {meta && (
        <Typography variant="overline" color="text.secondary">
          {meta}
        </Typography>
      )}
    </Stack>

    {subline}

    {children}
  </Stack>
);
