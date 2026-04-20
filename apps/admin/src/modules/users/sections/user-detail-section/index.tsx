"use client";

import { Grid, Stack, useTheme } from "@mui/material";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard } from "@repo/ui";

import { ProfileCard, UserForm } from "../../components";

type UserDetailSectionProps = {
  user: AdminUserView;
  isPending: boolean;
};

export const UserDetailSection = ({ user, isPending }: UserDetailSectionProps) => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <UserForm isEdit isLoading={isPending} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <FormCard title="Metadata">
              <Stack spacing={2}>
                <DetailField
                  label="Email Verified"
                  value={
                    user.emailVerified ? formatDate(user.emailVerified, "long") : "Not verified"
                  }
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
    </Stack>
  );
};
