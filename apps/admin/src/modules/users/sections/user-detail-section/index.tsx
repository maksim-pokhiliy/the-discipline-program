"use client";

import { Grid, MenuItem, Stack, TextField, useTheme } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { UserRole } from "@repo/contracts/auth";
import { type AdminUser } from "@repo/contracts/user";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard } from "@repo/ui";

import { ProfileCard } from "../../components/profile-card";
import { ROLE_CONFIG } from "../../constants";

type UserDetailSectionProps = {
  user: AdminUser;
  isPending: boolean;
};

export const UserDetailSection = ({ user, isPending }: UserDetailSectionProps) => {
  const theme = useTheme();
  const { control } = useFormContext<{ role: UserRole }>();

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
                      fullWidth={false}
                      disabled={isPending}
                      sx={{ minWidth: (theme) => theme.spacing(20) }}
                    >
                      {Object.values(UserRole).map((role) => (
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

          <ProfileCard user={user} />
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Account">
            <Stack spacing={2}>
              <DetailField label="ID" labelWidth={theme.spacing(10)} value={user.id} />
              <DetailField
                label="Image"
                labelWidth={theme.spacing(10)}
                value={user.image || "No image"}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};
