"use client";

import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { GENDER_LABELS } from "@repo/contracts/athlete-profile";
import { USER_ROLES, type UserRole } from "@repo/contracts/auth";
import { type AdminUser } from "@repo/contracts/user";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard } from "@repo/ui";

import { ROLE_CONFIG } from "../../constants";

interface UserDetailSectionProps {
  user: AdminUser;
  isPending: boolean;
}

export const UserDetailSection = ({ user, isPending }: UserDetailSectionProps) => {
  const { control } = useFormContext<{ role: UserRole }>();

  const profileCard = getProfileCard(user);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="User Information">
            <Stack spacing={2}>
              <DetailField label="Email" value={user.email} />
              <DetailField label="Role">
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      size="small"
                      disabled={isPending}
                      sx={{ minWidth: 160 }}
                    >
                      {USER_ROLES.map((role) => (
                        <MenuItem key={role} value={role}>
                          {ROLE_CONFIG[role].label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </DetailField>
              <DetailField
                label="Email Verified"
                value={user.emailVerified ? formatDate(user.emailVerified, "long") : "Not verified"}
              />
              <DetailField label="Registered" value={formatDate(user.createdAt, "long")} />
              <DetailField label="Updated" value={formatDate(user.updatedAt, "long")} />
            </Stack>
          </FormCard>

          {profileCard}
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Account">
            <Stack spacing={2}>
              <DetailField label="ID" labelWidth={80} value={user.id} />
              <DetailField label="Image" labelWidth={80} value={user.image || "No image"} />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};

const getProfileCard = (user: AdminUser) => {
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
          <DetailField label="Name" value={athleteProfile.name || "—"} />
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
