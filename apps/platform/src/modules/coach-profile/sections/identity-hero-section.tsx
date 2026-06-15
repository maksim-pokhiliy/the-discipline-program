"use client";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Chip, Stack, Typography } from "@mui/material";

import type { CoachProfilePageData } from "@repo/contracts/coaching/coach-profile";
import { COACH_PROFILE_CONSTANTS } from "@repo/contracts/coaching/coach-profile";
import { USER_ROLE_LABELS } from "@repo/contracts/iam/user";
import { DEFAULT_LOCALE } from "@repo/shared";
import { InlineEditText } from "@repo/ui";

import { useUpdateCoachProfile, useUploadImage } from "@app/lib/hooks";

import { ProfileAvatar, ProfileSection, SpecialtiesPicker } from "../components";

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
    <ProfileSection title="Identity">
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <ProfileAvatar
            name={user.name}
            email={user.email}
            image={user.image}
            isUploading={uploadImage.isPending}
            onFileSelect={handleFileSelect}
          />

          <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0, width: "100%" }}>
            <InlineEditText
              value={user.name ?? ""}
              onCommit={(name) => updateProfile.mutate({ name })}
              variant="h5"
              ariaLabel="Name"
              placeholder="Your name"
            />

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                size="small"
                variant="outlined"
                color="primary"
                label={USER_ROLE_LABELS[user.role]}
              />

              <Typography variant="body2" color="text.secondary">
                Coaching here since {formatSince(user.createdAt)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnOutlinedIcon fontSize="small" color="action" />

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
          </Stack>
        </Stack>

        <InlineEditText
          value={profile.bio ?? ""}
          onCommit={(bio) => updateProfile.mutate({ bio: bio || null })}
          variant="body1"
          ariaLabel="Bio"
          placeholder="Add a short bio"
          multiline
          emptyIsValid
          maxLength={COACH_PROFILE_CONSTANTS.MAX_BIO_LENGTH}
        />

        <SpecialtiesPicker
          value={profile.specialties}
          onChange={(specialties) => updateProfile.mutate({ specialties })}
        />
      </Stack>
    </ProfileSection>
  );
};
