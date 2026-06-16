"use client";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import { Box, Card, Chip, Stack, Typography, alpha } from "@mui/material";

import type { CoachProfilePageData } from "@repo/contracts/coaching/coach-profile";
import { COACH_PROFILE_CONSTANTS } from "@repo/contracts/coaching/coach-profile";
import { USER_ROLE_LABELS } from "@repo/contracts/iam/user";
import { DEFAULT_LOCALE } from "@repo/shared";
import { InlineEditText } from "@repo/ui";

import { useUpdateCoachProfile, useUploadImage } from "@app/lib/hooks";

import { ProfileAvatar, SpecialtiesEditor } from "../components";

type IdentityHeroSectionProps = {
  pageData: CoachProfilePageData;
};

const SINCE_FORMATTER = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
  month: "short",
  year: "numeric",
});

const formatSince = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);

  return SINCE_FORMATTER.format(date);
};

export const IdentityHeroSection: React.FC<IdentityHeroSectionProps> = ({ pageData }) => {
  const { user, profile } = pageData;
  const updateProfile = useUpdateCoachProfile();
  const uploadImage = useUploadImage();

  const handleFileSelect = (file: File) => {
    uploadImage.mutate(
      { file, context: "avatar" },
      { onSuccess: ({ url }) => updateProfile.mutate({ image: url }) },
    );
  };

  return (
    <Card>
      <Box
        sx={(theme) => ({
          px: 1.75,
          py: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.common.white, 0.015),
        })}
      >
        <Typography variant="overline" color="primary">
          As your athletes see you
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={2.25}
        alignItems="flex-start"
        sx={{ p: { xs: 1.75, sm: 2.25 } }}
      >
        <ProfileAvatar
          name={user.name}
          email={user.email}
          image={user.image}
          isUploading={uploadImage.isPending}
          onFileSelect={handleFileSelect}
        />

        <Stack spacing={1.25} sx={{ flexGrow: 1, minWidth: 0 }}>
          <InlineEditText
            value={user.name ?? ""}
            onCommit={(name) => updateProfile.mutate({ name })}
            variant="h2"
            ariaLabel="Name"
            placeholder="Your name"
            maxLength={COACH_PROFILE_CONSTANTS.MAX_NAME_LENGTH}
            sx={{ ".MuiInputBase-input": { fontSize: { xs: "1.625rem", sm: "2rem" } } }}
          />

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            sx={{ rowGap: 0.5 }}
          >
            <Chip size="small" color="primary" label={USER_ROLE_LABELS[user.role]} />

            <Typography variant="body2" color="text.secondary">
              Coaching here since{" "}
              <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                {formatSince(user.createdAt)}
              </Box>
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnOutlinedIcon fontSize="small" sx={{ color: "text.muted" }} />

            <InlineEditText
              value={profile.location ?? ""}
              onCommit={(location) => updateProfile.mutate({ location: location || null })}
              variant="body1"
              ariaLabel="Location"
              placeholder="Add location"
              emptyIsValid
              maxLength={COACH_PROFILE_CONSTANTS.MAX_LOCATION_LENGTH}
            />
          </Stack>

          <InlineEditText
            value={profile.bio ?? ""}
            onCommit={(bio) => updateProfile.mutate({ bio: bio || null })}
            variant="body1"
            ariaLabel="Bio"
            placeholder="Two sentences your athletes will see on the platform. Where you train, who you train, what you're known for."
            multiline
            emptyIsValid
            maxLength={COACH_PROFILE_CONSTANTS.MAX_BIO_LENGTH}
          />

          <SpecialtiesEditor
            value={profile.specialties}
            onChange={(specialties) => updateProfile.mutate({ specialties })}
          />
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        flexWrap="wrap"
        sx={(theme) => ({
          px: 1.75,
          py: 1.25,
          borderTop: `1px dashed ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.common.white, 0.01),
        })}
      >
        <SyncIcon sx={{ fontSize: 16, color: "text.muted" }} />

        <Typography variant="caption" color="text.muted" sx={{ flexGrow: 1, minWidth: 160 }}>
          Changes are live — your athletes see them next time they open the app.
        </Typography>

        <Typography
          variant="overline"
          color="primary"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          Edit inline
        </Typography>
      </Stack>
    </Card>
  );
};
