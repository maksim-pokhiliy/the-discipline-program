"use client";

import { Stack, Typography } from "@mui/material";

import { GENDER_LABELS } from "@repo/contracts/athlete-profile";
import { type AdminUser } from "@repo/contracts/user";
import { DetailField, FormCard } from "@repo/ui";

interface ProfileCardProps {
  user: AdminUser;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  const { role, athleteProfile, coachProfile } = user;

  if (role === "USER") {
    if (!athleteProfile) {
      return (
        <FormCard title="Athlete Profile">
          <Typography variant="body2" color="text.secondary">
            Profile not created yet.
          </Typography>
        </FormCard>
      );
    }

    return (
      <FormCard title="Athlete Profile">
        <Stack spacing={2}>
          <DetailField label="Name" value={user.name || "—"} />
          <DetailField
            label="Gender"
            value={athleteProfile.gender ? GENDER_LABELS[athleteProfile.gender] : "—"}
          />
          <DetailField
            label="Height"
            value={athleteProfile.heightCm ? `${athleteProfile.heightCm} cm` : "—"}
          />
          <DetailField
            label="Weight"
            value={athleteProfile.weightKg ? `${athleteProfile.weightKg} kg` : "—"}
          />
        </Stack>
      </FormCard>
    );
  }

  if (role === "COACH") {
    if (!coachProfile) {
      return (
        <FormCard title="Coach Profile">
          <Typography variant="body2" color="text.secondary">
            Profile not created yet.
          </Typography>
        </FormCard>
      );
    }

    return (
      <FormCard title="Coach Profile">
        <Stack spacing={2}>
          <DetailField label="Bio" value={coachProfile.bio || "—"} />
        </Stack>
      </FormCard>
    );
  }

  return null;
};
